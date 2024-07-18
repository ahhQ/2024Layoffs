let filteredCountry = null;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    frameWidth = windowWidth * 0.75;
    let totalHeight = windowHeight * 2; // Double the window height for initial canvas

    // Create a scrollable div for the frame
    scrollableDiv = createDiv();
    scrollableDiv.position(windowWidth * 0.30, 0); // Adjust position to account for the sticky section
    scrollableDiv.style('width', `${frameWidth}px`);
    scrollableDiv.style('height', `${windowHeight}px`);
    scrollableDiv.style('overflow-y', 'scroll');
    scrollableDiv.style('overflow-x', 'hidden');

    // Move the canvas inside the scrollable div
    canvas.parent(scrollableDiv);

    processData();
    assignColors();
    createLegend(); // Call the createLegend function here
    textFont('Space Mono'); // Set the font to Space Mono

    document.getElementById('legend-toggle').addEventListener('click', toggleLegendPopup);
}

function draw() {
    background(240);
    drawBoxesAndBooks();
}

function drawBoxesAndBooks() {
    let xOffset = 20;
    let yOffset = 50;
    let boxesInCurrentRow = 0;
    let maxLayoffs = getMaxLayoffs();

    Object.entries(industries).forEach(([industry, companies]) => {
        let totalCompanies = companies.length;
        let totalBoxesNeeded = Math.ceil(totalCompanies / maxBooksPerBox);

        for (let boxIndex = 0; boxIndex < totalBoxesNeeded; boxIndex++) {
            let boxX = xOffset;
            let boxY = yOffset;

            // Draw the box
            fill(industryColors[industry]);
            rect(boxX, boxY, boxWidth, boxHeight);
            noStroke();

            // Draw industry name on the first box of the industry
            if (boxIndex === 0) {
                fill(0);
                textAlign(LEFT, BOTTOM);
                textSize(10);
                text(industry, boxX, boxY + boxHeight + 15); // Position the label to the left bottom of the box
            }

            let booksDrawn = 0;
            let startIndex = boxIndex * maxBooksPerBox;
            let endIndex = Math.min(startIndex + maxBooksPerBox, totalCompanies);

            for (let i = startIndex; i < endIndex; i++) {
                let company = companies[i];
                if (filteredCountry && company.country !== filteredCountry) continue;

                let bookHeight = map(company.total_laid_off, 0, maxLayoffs, 3, 80);
                let bookX = boxX + (booksDrawn * (bookWidth + 2)) + 5;
                let bookY = boxY - bookHeight; // Place books on top of the box

                fill(countryColors[company.country]);
                rect(bookX, bookY, bookWidth, bookHeight);

                booksDrawn++;

                // Add event listeners for hovering
                let bookDiv = createDiv();
                bookDiv.style('position', 'absolute');
                bookDiv.style('left', `${bookX}px`);
                bookDiv.style('top', `${bookY}px`);
                bookDiv.style('width', `${bookWidth}px`);
                bookDiv.style('height', `${bookHeight}px`);
                bookDiv.style('background-color', countryColors[company.country].toString());
                bookDiv.mouseOver(showInfo.bind(null, company));
                bookDiv.mouseOut(hideInfo);
                canvas.parent().child(bookDiv);
            }

            boxesInCurrentRow++;
            if (boxesInCurrentRow >= boxesPerRow) {
                xOffset = 20;
                yOffset += boxHeight + 120; // Increased vertical spacing to accommodate books
                boxesInCurrentRow = 0;
            } else {
                xOffset += boxWidth + 20; // Increased horizontal spacing
            }
        }
    });

    // Adjust canvas height if needed
    if (yOffset + boxHeight > height) {
        resizeCanvas(frameWidth, yOffset + boxHeight + 20);
    }
}

function toggleLegendPopup() {
    const legendPopup = document.getElementById('legend-popup');
    if (legendPopup.classList.contains('hidden')) {
        legendPopup.classList.remove('hidden');
        document.getElementById('legend-toggle').innerText = 'Legend -';
    } else {
        legendPopup.classList.add('hidden');
        document.getElementById('legend-toggle').innerText = 'Legend +';
    }
}

function createLegend() {
    const legendContainer = document.getElementById('legend-container');
    legendContainer.innerHTML = ''; // Clear any existing content

    Object.entries(countryColors).forEach(([country, color]) => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('legend-item');

        const colorBox = document.createElement('div');
        colorBox.classList.add('legend-color');
        colorBox.style.backgroundColor = color.toString();
        colorBox.addEventListener('click', () => filterByCountry(country));

        const countryLabel = document.createElement('span');
        countryLabel.innerText = country;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(countryLabel);
        legendContainer.appendChild(legendItem);
    });
}

function filterByCountry(country) {
    if (filteredCountry === country) {
        filteredCountry = null; // Remove filter if the same country is clicked again
    } else {
        filteredCountry = country;
    }
    redraw(); // Redraw canvas to apply the filter
}

function showInfo(company) {
    const infoContainer = document.getElementById('info-container');
    const infoList = document.getElementById('info-list');

    infoList.innerHTML = `
        <li><strong>Company:</strong> ${company.company}</li>
        <li><strong>Location:</strong> ${company.location}</li>
        <li><strong>Country:</strong> ${company.country}</li>
        <li><strong>Industry:</strong> ${company.industry}</li>
        <li><strong>Total Laid Off:</strong> ${company.total_laid_off}</li>
        <li><strong>Date:</strong> ${company.date}</li>
    `;

    infoContainer.style.display = 'block';
}

function hideInfo() {
    const infoContainer = document.getElementById('info-container');
    infoContainer.style.display = 'none';
}

function updateHandBox() {
    const handBoxContainer = document.getElementById('hand-box-container');
    handBoxContainer.innerHTML = ''; // Clear previous content

    if (!selectedBoxContent) return;

    const { industry, companies } = selectedBoxContent;
    const maxLayoffs = getMaxLayoffs();
    const boxDiv = document.createElement('div');
    const smallerBoxWidth = 110; // Smaller box width
    const smallerBoxHeight = 60; // Smaller box height
    const smallerBookWidth = 18; // Adjust the book width to fit the smaller box
    const bookSpacing = 5; // Adjust the spacing between the first book and the left edge

    boxDiv.style.position = 'relative';
    boxDiv.style.width = `${smallerBoxWidth}px`;
    boxDiv.style.height = `${smallerBoxHeight}px`;
    boxDiv.style.backgroundColor = industryColors[industry].toString();
    companies.forEach((company, index) => {
        const bookDiv = document.createElement('div');
        const bookHeight = map(company.total_laid_off, 0, maxLayoffs, 3, 80);
        bookDiv.style.position = 'absolute';
        bookDiv.style.width = `${smallerBookWidth}px`;
        bookDiv.style.height = `${bookHeight}px`;
        bookDiv.style.backgroundColor = countryColors[company.country].toString();
        bookDiv.style.left = `${bookSpacing + index * (smallerBookWidth + 2)}px`; // Add spacing to the left
        bookDiv.style.bottom = `60px`; // Ensure books are on top of the smaller box
        bookDiv.dataset.company = company.company;
        bookDiv.dataset.location = company.location;
        bookDiv.dataset.country = company.country;
        bookDiv.dataset.industry = company.industry;
        bookDiv.dataset.totalLaidOff = company.total_laid_off;
        bookDiv.dataset.date = company.date;
        bookDiv.addEventListener('mouseenter', showInfo.bind(null, company));
        bookDiv.addEventListener('mouseleave', hideInfo);
        boxDiv.appendChild(bookDiv);
    });
 
    handBoxContainer.appendChild(boxDiv);
}

function windowResized() {
frameWidth = windowWidth * 0.75;
resizeCanvas(frameWidth, windowHeight);
scrollableDiv.style('width', `${frameWidth}px`);
scrollableDiv.style('height', `${windowHeight}px`);
}