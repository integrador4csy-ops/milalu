// api/save-product.js - Vercel Serverless Function para agregar, editar y eliminar productos en GitHub
export default async function handler(req, res) {
  // Encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Solo se acepta POST.' });
  }

  try {
    const { password, product, imageBase64, githubToken, action } = req.body;

    if (!product || !product.id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios del producto (ID).' });
    }

    // Validar contraseña de administración (por defecto 'milalu2026' o la variable de entorno)
    const expectedPassword = process.env.ADMIN_PASSWORD || 'milalu2026';
    if (password !== expectedPassword) {
      return res.status(401).json({ error: 'Contraseña de administración incorrecta.' });
    }

    // Obtener token de GitHub (desde variable de entorno en Vercel o enviado desde configuración)
    const token = process.env.GITHUB_TOKEN || githubToken;

    if (!token) {
      return res.status(200).json({
        success: true,
        committed: false,
        message: 'Cambio guardado en este navegador. Para sincronizar automáticamente con Vercel para todos los visitantes, agrega GITHUB_TOKEN en los ajustes de Vercel.'
      });
    }

    const repo = 'integrador4csy-ops/milalu';
    const branch = 'main';

    let finalImagePath = product.image;

    // 1. Si es acción de guardar/editar y se envió una nueva imagen en base64, subirla a GitHub
    if (action !== 'delete' && imageBase64 && imageBase64.startsWith('data:image')) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageFileName = `${product.id}.png`;
      const githubImagePath = `public/images/products/${imageFileName}`;
      finalImagePath = `/images/products/${imageFileName}`;

      // Verificar si el archivo ya existe para obtener su SHA
      let existingImageSha = null;
      try {
        const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${githubImagePath}?ref=${branch}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Milalu-App'
          }
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          existingImageSha = checkData.sha;
        }
      } catch (e) {
        // Archivo nuevo
      }

      const commitImgRes = await fetch(`https://api.github.com/repos/${repo}/contents/${githubImagePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Milalu-App'
        },
        body: JSON.stringify({
          message: `Foto producto: ${product.name}`,
          content: cleanBase64,
          branch: branch,
          ...(existingImageSha ? { sha: existingImageSha } : {})
        })
      });

      if (!commitImgRes.ok) {
        const errorText = await commitImgRes.text();
        console.error('Error al subir imagen a GitHub:', errorText);
      }
    }

    // 2. Obtener archivo actual src/data/products.json desde GitHub
    const productsFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/src/data/products.json?ref=${branch}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Milalu-App'
      }
    });

    if (!productsFileRes.ok) {
      throw new Error('No se pudo leer products.json desde GitHub.');
    }

    const productsFileData = await productsFileRes.json();
    const currentSha = productsFileData.sha;
    const currentContent = Buffer.from(productsFileData.content, 'base64').toString('utf8');
    let productsList = JSON.parse(currentContent);

    let commitMessage = '';

    // 3. Modificar lista según acción (delete vs save/edit)
    if (action === 'delete') {
      productsList = productsList.filter(p => p.id !== product.id);
      commitMessage = `Eliminar producto: ${product.name} (Milalú Web)`;
    } else {
      const updatedProduct = {
        ...product,
        image: finalImagePath
      };

      const existingIndex = productsList.findIndex(p => p.id === product.id);
      if (existingIndex >= 0) {
        productsList[existingIndex] = updatedProduct;
        commitMessage = `Actualizar producto: ${product.name} (Milalú Web)`;
      } else {
        productsList.push(updatedProduct);
        commitMessage = `Agregar producto: ${product.name} (Milalú Web)`;
      }
    }

    // 4. Hacer commit a GitHub de src/data/products.json
    const updatedContentBase64 = Buffer.from(JSON.stringify(productsList, null, 2), 'utf8').toString('base64');
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/src/data/products.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Milalu-App'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: updatedContentBase64,
        sha: currentSha,
        branch: branch
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Error al actualizar products.json: ${errText}`);
    }

    return res.status(200).json({
      success: true,
      committed: true,
      message: action === 'delete'
        ? '¡Producto eliminado en GitHub! Vercel actualizará la página en unos segundos.'
        : '¡Cambios guardados en GitHub! Vercel actualizará la página en unos segundos.'
    });

  } catch (error) {
    console.error('Error en save-product:', error);
    return res.status(500).json({
      error: error.message || 'Error interno del servidor al procesar el producto.'
    });
  }
}
