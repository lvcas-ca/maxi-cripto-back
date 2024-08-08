const express = require('express');
const { chromium } = require('playwright'); // Importa Playwright
const fs = require('fs'); // Importa el módulo del sistema de archivos
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use('/src', express.static(path.join(__dirname, 'src')));

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

// Función para cargar los datos desde los archivos JSON si existen
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

// Variables para almacenar los datos en memoria
let dataNegative = null;
let dataPositive = null;

// Carga los datos desde los archivos al iniciar el servidor
loadDataFromFiles();

// Realiza el scraping al iniciar el servidor si los archivos JSON no existen o están vacíos
if (!dataNegative || !dataPositive) {
  scrapeData().then(() => {
    console.log('Datos iniciales cargados mediante scraping.');
  }).catch(error => {
    console.error('Error al realizar el scraping inicial:', error);
  });
}

// Ruta para la raíz
app.get('/', (req, res) => {
  res.send('Bienvenido a mi API de scraping');
});

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
  if (dataNegative) {
    res.json(dataNegative);
  } else {
    res.status(404).json({ error: 'Datos negativos no encontrados' });
  }
});

// Ruta para obtener los datos positivos
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
