let layoffsData;
let canvas;
let frameWidth;
let frameHeight;
let industries = {};
let countries = {};
let industryColors = {};
let countryColors = {};
let boxWidth = 150;
let boxHeight = 80;
let bookWidth = 20;
let maxBooksPerBox = 5;
let boxesPerRow = 6;
let scrollableDiv;
let selectedBoxContent = null;
let selectedCountries = [];

function preload() {
    loadTable('layoffs_2024_sorted_by_industry.csv', 'csv', 'header', (table) => {
        layoffsData = table.getArray();
    });
}

function windowResized() {
    frameWidth = windowWidth * 0.7;
    if (windowWidth <= 1024) {
        frameWidth = windowWidth * 0.65;
    }
    if (windowWidth <= 768) {
        frameWidth = windowWidth * 0.5;
    }
    if (windowWidth <= 480) {
        frameWidth = windowWidth;
    }
    resizeCanvas(frameWidth, windowHeight * 2);
    scrollableDiv.style('width', `${frameWidth}px`);
    scrollableDiv.style('height', `${windowHeight}px`);
}

function setup() {
    frameWidth = windowWidth * 0.7;
    if (windowWidth <= 1024) {
        frameWidth = windowWidth * 0.65;
    }
    if (windowWidth <= 768) {
        frameWidth = windowWidth * 0.5;
    }
    if (windowWidth <= 480) {
        frameWidth = windowWidth;
    }
    canvas = createCanvas(frameWidth, windowHeight * 2); 

    scrollableDiv = createDiv();
    scrollableDiv.position(windowWidth * 0.3, 0); 
    scrollableDiv.style('width', `${frameWidth}px`);
    scrollableDiv.style('height', `${windowHeight}px`);
    scrollableDiv.style('overflow-y', 'scroll');
    scrollableDiv.style('overflow-x', 'hidden');
    scrollableDiv.style('position', 'absolute');

    canvas.parent(scrollableDiv);

    processData();
    assignColors();
    createLegend(); 
    textFont('Space Mono'); 

    document.getElementById('legend-toggle').addEventListener('click', toggleLegendPopup);
    document.getElementById('unclick-all').addEventListener('click', unclickAll);
}

function draw() {
    background(240);
    drawBoxesAndBooks();
}

function mousePressed() {
    let xOffset = 25;
    let yOffset = 50;
    let boxesInCurrentRow = 0;

    Object.entries(industries).forEach(([industry, companies]) => {
        let totalCompanies = companies.length;
        let totalBoxesNeeded = Math.ceil(totalCompanies / maxBooksPerBox);

        for (let boxIndex = 0; boxIndex < totalBoxesNeeded; boxIndex++) {
            let boxX = xOffset;
            let boxY = yOffset;

            if (mouseX > boxX && mouseX < boxX + boxWidth && mouseY > boxY && mouseY < boxY + boxHeight) {
                selectedBoxContent = { industry, companies: companies.slice(boxIndex * maxBooksPerBox, (boxIndex + 1) * maxBooksPerBox) };
                updateHandBox();
            }

            let booksDrawn = 0;
            let startIndex = boxIndex * maxBooksPerBox;
            let endIndex = Math.min(startIndex + maxBooksPerBox, totalCompanies);

            for (let i = startIndex; i < endIndex; i++) {
                let company = companies[i];
                let bookHeight = map(company.total_laid_off, 0, getMaxLayoffs(), 3, 80);
                let bookX = boxX + (booksDrawn * (bookWidth + 2)) + 5;
                let bookY = boxY - bookHeight;

                booksDrawn++;
            }

            boxesInCurrentRow++;
            if (boxesInCurrentRow >= boxesPerRow) {
                xOffset = 25;
                yOffset += boxHeight + 120;
                boxesInCurrentRow = 0;
            } else {
                xOffset += boxWidth + 20;
            }
        }
    });
}

function processData() {
    layoffsData.forEach(row => {
        let industry = row[2];
        let country = row[7];
        let total_laid_off = parseFloat(row[3]) || 0;
        let company = row[0];
        let location = row[1];
        let date = row[5];

        if (!industries[industry]) {
            industries[industry] = [];
        }
        industries[industry].push({ company, location, country, industry, total_laid_off, date });

        if (!countries[country]) {
            countries[country] = true;
        }
    });
}

function assignColors() {
    let industryList = Object.keys(industries);
    let countryList = Object.keys(countries);

    colorMode(HSB, 360, 100, 100);
    for (let i = 0; i < industryList.length; i++) {
        let hue = map(i, 0, industryList.length, 0, 360);
        industryColors[industryList[i]] = color(hue, 30, 80);
    }

    for (let i = 0; i < countryList.length; i++) {
        let hue = map(i, 0, countryList.length, 0, 360);
        countryColors[countryList[i]] = color(hue, 50, 70);
    }
    colorMode(RGB);
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

            fill(industryColors[industry]);
            rect(boxX, boxY, boxWidth, boxHeight);
            noStroke();

            if (boxIndex === 0) {
                fill(0);
                textAlign(LEFT, BOTTOM);
                textSize(10);
                text(industry, boxX, boxY + boxHeight + 15); 
            }
            let booksDrawn = 0;
            let startIndex = boxIndex * maxBooksPerBox;
            let endIndex = Math.min(startIndex + maxBooksPerBox, totalCompanies);

            for (let i = startIndex; i < endIndex; i++) {
                let company = companies[i];
                let bookHeight = map(company.total_laid_off, 0, maxLayoffs, 3, 80);
                let bookX = boxX + (booksDrawn * (bookWidth + 2)) + 5;
                let bookY = boxY - bookHeight; 

                if (selectedCountries.length === 0 || selectedCountries.includes(company.country)) {
                    fill(countryColors[company.country]);
                    rect(bookX, bookY, bookWidth, bookHeight);
                }

                booksDrawn++;
            }

            boxesInCurrentRow++;
            if (boxesInCurrentRow >= boxesPerRow) {
                xOffset = 20;
                yOffset += boxHeight + 120; 
                boxesInCurrentRow = 0;
            } else {
                xOffset += boxWidth + 20; 
            }
        }
    });

    if (yOffset + boxHeight > height) {
        resizeCanvas(frameWidth, yOffset + boxHeight + 20);
    }
}

function getMaxLayoffs() {
    let max = 0;
    Object.values(industries).forEach(companies => {
        companies.forEach(company => {
            if (company.total_laid_off > max) max = company.total_laid_off;
        });
    });
    return max;
}

function toggleLegendPopup() {
    const legendPopup = document.getElementById('legend-popup');
    const stickySection = document.getElementById('sticky-section');
    if (legendPopup.classList.contains('hidden')) {
        legendPopup.classList.remove('hidden');
        document.getElementById('legend-toggle').innerText = 'Legend -';
        stickySection.classList.add('blur');
    } else {
        legendPopup.classList.add('hidden');
        document.getElementById('legend-toggle').innerText = 'Legend +';
        stickySection.classList.remove('blur');
    }
}

function createLegend() {
    const legendContainer = document.getElementById('legend-container');
    legendContainer.innerHTML = ''; 
    Object.entries(countryColors).forEach(([country, color]) => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('legend-item');

        const colorBox = document.createElement('div');
        colorBox.classList.add('legend-color');
        colorBox.style.backgroundColor = color.toString();
        colorBox.addEventListener('click', () => toggleCountryFilter(country));

        const countryLabel = document.createElement('span');
        countryLabel.innerText = country;
        countryLabel.id = `label-${country}`; 

        legendItem.appendChild(colorBox);
        legendItem.appendChild(countryLabel);
        legendContainer.appendChild(legendItem);
    });
}

function toggleCountryFilter(country) {
    const index = selectedCountries.indexOf(country);
    if (index === -1) {
        selectedCountries.push(country);
    } else {
        selectedCountries.splice(index, 1);
    }
    updateLegendStyles();
    redraw(); 
}

function updateLegendStyles() {
    selectedCountries.forEach(country => {
        document.getElementById(`label-${country}`).classList.add('selected-country');
    });
    Object.keys(countryColors).forEach(country => {
        if (!selectedCountries.includes(country)) {
            document.getElementById(`label-${country}`).classList.remove('selected-country');
        }
    });
}

function unclickAll() {
    selectedCountries = [];
    updateLegendStyles();
    redraw();
}

function updateHandBox() {
    const handBoxContainer = document.getElementById('hand-box-container');
    handBoxContainer.innerHTML = ''; 
    if (!selectedBoxContent) return;

    const { industry, companies } = selectedBoxContent;
    const maxLayoffs = getMaxLayoffs();
    const boxDiv = document.createElement('div');
    const smallerBoxWidth = 110; 
    const smallerBoxHeight = 60; 
    const smallerBookWidth = 18; 
    const bookSpacing = 5; 
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
        bookDiv.style.left = `${bookSpacing + index * (smallerBookWidth + 2)}px`; 
        bookDiv.style.bottom = `60px`; 
        bookDiv.dataset.company = company.company;
        bookDiv.dataset.location = company.location;
        bookDiv.dataset.country = company.country

            ;
        bookDiv.dataset.industry = company.industry;
        bookDiv.dataset.totalLaidOff = company.total_laid_off;
        bookDiv.dataset.date = company.date;
        bookDiv.addEventListener('mouseenter', showInfo);
        bookDiv.addEventListener('mouseleave', hideInfo);
        boxDiv.appendChild(bookDiv);
    });

    handBoxContainer.appendChild(boxDiv);
}

function showInfo(event) {
    const infoContainer = document.getElementById('info-container');
    const infoList = document.getElementById('info-list');
    const bookDiv = event.currentTarget;
    infoList.innerHTML = `
    <li><strong>Company:</strong> ${bookDiv.dataset.company}</li>
    <li><strong>Location:</strong> ${bookDiv.dataset.location}</li>
    <li><strong>Country:</strong> ${bookDiv.dataset.country}</li>
    <li><strong>Industry:</strong> ${bookDiv.dataset.industry}</li>
    <li><strong>Total Laid Off:</strong> ${bookDiv.dataset.totalLaidOff}</li>
    <li><strong>Date:</strong> ${bookDiv.dataset.date}</li>
`;

    infoContainer.style.display = 'block';
}

function hideInfo() {
    const infoContainer = document.getElementById('info-container');
    infoContainer.style.display = 'none';
}
