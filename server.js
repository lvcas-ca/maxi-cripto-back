const express = require('express');
const { chromium } = require('playwright'); // Importa Playwright
const fs = require('fs'); // Importa el módulo del sistema de archivos
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const scrapeData = async () => {
  // Inicia el navegador y abre una nueva página
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navega a la página deseada
  await page.goto('https://bolsar.info/Cedears.php');
  // Espera a que el elemento 'Variación' esté visible
  await page.waitForSelector('text=Variación');
  // Hace clic en el elemento que contiene la palabra 'Variación' para obtener los negativos
  await page.click('text=Variación');

  const buildArray = () => {
    return Array.from(document.querySelectorAll('tr')).map(tr => {
      const tds = tr.querySelectorAll('td');
      return {
        nombre: tds[0] ? tds[0].innerText.trim() : null,
        variacion: tds[7] ? tds[7].innerText.trim() : null
        // Puedes agregar más campos aquí según sea necesario
      };
    }).filter(item => item.nombre); // Filtra las filas que no tienen 'nombre'
  };

  // Realiza el scraping y guarda los datos negativos CEDEAR
  const dataNegative = await page.evaluate(buildArray);
  await page.click('text=Variación');
  // Realiza el scraping y guarda los datos positivos CEDEAR
  const dataPositive = await page.evaluate(buildArray);

  // Escribe los datos en un archivo JSON
  fs.writeFileSync(path.join(__dirname, 'src', 'dataNegative.json'), JSON.stringify(dataNegative, null, 2));
  fs.writeFileSync(path.join(__dirname, 'src', 'dataPositive.json'), JSON.stringify(dataPositive, null, 2));

  // Cierra el navegador
  await browser.close();
};

// Ruta para iniciar el scraping manualmente
app.get('/scrape', async (req, res) => {
  try {
    await scrapeData();
    res.json({ message: 'Scraping completado y datos guardados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener los datos negativos
app.get('/dataNegative', (req, res) => {
  const dataPath = path.join(__dirname, 'src', 'dataNegative.json');
  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.status(404).json({ error: 'Archivo dataNegative.json no encontrado' });
  }
});

// Ruta para obtener los datos positivos
app.get('/dataPositive', (req, res) => {
  const dataPath = path.join(__dirname, 'src', 'dataPositive.json');
  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.status(404).json({ error: 'Archivo dataPositive.json no encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

