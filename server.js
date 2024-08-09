const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');  // Importa el paquete cors
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS para todas las solicitudes
app.use(cors());

app.use('/src', express.static(path.join(__dirname, 'src')));

const scrapeData = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://bolsar.info/Cedears.php');
  await page.waitForSelector('text=Variación');
  await page.click('text=Variación');

  const buildArray = () => {
    return Array.from(document.querySelectorAll('tr')).map(tr => {
      const tds = tr.querySelectorAll('td');
      return {
        nombre: tds[0] ? tds[0].innerText.trim() : null,
        variacion: tds[7] ? tds[7].innerText.trim() : null
      };
    }).filter(item => item.nombre);
  };

  const dataNegative = await page.evaluate(buildArray);
  await page.click('text=Variación');
  const dataPositive = await page.evaluate(buildArray);

  fs.writeFileSync(path.join(__dirname, 'src', 'dataNegative.json'), JSON.stringify(dataNegative, null, 2));
  fs.writeFileSync(path.join(__dirname, 'src', 'dataPositive.json'), JSON.stringify(dataPositive, null, 2));

  await browser.close();
};

const loadDataFromFiles = () => {
  const dataNegativePath = path.join(__dirname, 'src', 'dataNegative.json');
  const dataPositivePath = path.join(__dirname, 'src', 'dataPositive.json');

  if (fs.existsSync(dataNegativePath)) {
    dataNegative = JSON.parse(fs.readFileSync(dataNegativePath, 'utf-8'));
  }

  if (fs.existsSync(dataPositivePath)) {
    dataPositive = JSON.parse(fs.readFileSync(dataPositivePath, 'utf-8'));
  }
};

let dataNegative = null;
let dataPositive = null;

loadDataFromFiles();

if (!dataNegative || !dataPositive) {
  scrapeData().then(() => {
    console.log('Datos iniciales cargados mediante scraping.');
  }).catch(error => {
    console.error('Error al realizar el scraping inicial:', error);
  });
}

const checkMarketOpenAndScrape = async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  if (currentDay >= 1 && currentDay <= 5 && currentHour >= 11 && currentHour < 17) {
    console.log('El mercado está abierto. Realizando scraping...');
    await scrapeData();
    console.log('Datos actualizados.');
  } else {
    console.log('El mercado está cerrado.');
  }
};

setInterval(checkMarketOpenAndScrape, 60 * 60 * 1000);

app.get('/', (req, res) => {
  res.send('Bienvenido a mi API de scraping');
});

app.get('/scrape', async (req, res) => {
  try {
    await scrapeData();
    res.json({ message: 'Scraping completado y datos guardados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/dataNegative', (req, res) => {
  if (dataNegative) {
    res.json(dataNegative);
  } else {
    res.status(404).json({ error: 'Datos negativos no encontrados' });
  }
});

app.get('/dataPositive', (req, res) => {
  if (dataPositive) {
    res.json(dataPositive);
  } else {
    res.status(404).json({ error: 'Datos positivos no encontrados' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
