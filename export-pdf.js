const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // 16:9 viewport
    await page.setViewport({ width: 1920, height: 1080 });

    const filePath = path.resolve(__dirname, 'presentation.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // Get total slide count
    const totalSlides = await page.evaluate(() => {
        return document.querySelectorAll('.slide').length;
    });

    console.log(`Total slides: ${totalSlides}`);

    // Capture each slide as a PDF page
    const pages = [];
    for (let i = 0; i < totalSlides; i++) {
        console.log(`Capturing slide ${i + 1}/${totalSlides}...`);

        // Navigate to slide
        await page.evaluate((index) => {
            const slides = document.querySelectorAll('.slide');
            slides.forEach(s => s.classList.remove('active'));
            slides[index].classList.add('active');
        }, i);

        // Wait for animations
        await new Promise(r => setTimeout(r, 600));

        // Screenshot each slide as PNG buffer
        const slideEl = await page.evaluate((index) => {
            const slides = document.querySelectorAll('.slide');
            const rect = slides[index].getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }, i);

        const screenshot = await page.screenshot({
            clip: { x: 0, y: 0, width: 1920, height: 1080 },
            encoding: 'binary'
        });

        pages.push(screenshot);
    }

    // Create a new page to combine all screenshots into PDF
    const pdfPage = await browser.newPage();

    const imagesBase64 = pages.map(buf => Buffer.from(buf).toString('base64'));

    const htmlContent = `
    <html>
    <head>
        <style>
            * { margin: 0; padding: 0; }
            body { background: #000; }
            .page {
                width: 1920px;
                height: 1080px;
                page-break-after: always;
                overflow: hidden;
            }
            .page:last-child {
                page-break-after: avoid;
            }
            .page img {
                width: 100%;
                height: 100%;
                display: block;
            }
        </style>
    </head>
    <body>
        ${imagesBase64.map(b64 => `<div class="page"><img src="data:image/png;base64,${b64}"></div>`).join('\n')}
    </body>
    </html>`;

    await pdfPage.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const outputPath = path.resolve(__dirname, 'presentation.pdf');
    await pdfPage.pdf({
        path: outputPath,
        width: '1920px',
        height: '1080px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    console.log(`PDF saved: ${outputPath}`);
    await browser.close();
})();
