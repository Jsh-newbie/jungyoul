const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 16:9 고해상도 (1920x1080 기본, deviceScaleFactor 3으로 최고 화질)
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 3
  });

  const filePath = path.resolve(__dirname, 'presentation.html');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  // 슬라이드 총 개수 파악
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('.slide').length;
  });
  console.log(`총 ${slideCount}개 슬라이드 발견`);

  // 제외할 슬라이드 (0-based index)
  const skipSlides = [2]; // 3번 슬라이드 제외

  // 각 슬라이드를 PNG로 캡처
  const screenshots = [];
  for (let i = 0; i < slideCount; i++) {
    if (skipSlides.includes(i)) {
      console.log(`슬라이드 ${i + 1}/${slideCount} 건너뜀`);
      continue;
    }
    // 모든 슬라이드 숨기고 i번째만 활성화
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, j) => {
        s.classList.remove('active', 'exit-left');
        s.style.opacity = j === idx ? '1' : '0';
        s.style.visibility = j === idx ? 'visible' : 'hidden';
        s.style.transform = 'none';
        s.style.transition = 'none';
      });
    }, i);

    // 애니메이션/렌더링 대기
    await new Promise(r => setTimeout(r, 500));

    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });

    screenshots.push(screenshotBuffer);
    console.log(`슬라이드 ${i + 1}/${slideCount} 캡처 완료`);
  }

  await browser.close();

  // pdf-lib로 고화질 PDF 생성
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < screenshots.length; i++) {
    const pngImage = await pdfDoc.embedPng(screenshots[i]);
    // 16:9 비율, 고해상도 포인트 (1920x1080 -> PDF 크기)
    const pageWidth = 1920 * 0.5;  // 960pt
    const pageHeight = 1080 * 0.5; // 540pt
    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve(__dirname, 'presentation.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`\nPDF 생성 완료: ${outputPath}`);
  console.log(`파일 크기: ${(pdfBytes.length / 1024 / 1024).toFixed(1)}MB`);
})();
