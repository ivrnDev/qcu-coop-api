const pool = require('../db/database')
const { productQueries } = require('../db/dbQueries.js')
const {
  createProductQuery,
  createVariantQuery,
  getAllVariantsQuery,
  updateVariantQuery,
  getVariantByIdQuery,
  getVariantByProductIdQuery,
  updateProductQuery,
  deleteVariantsQuery,
  getAllProductsQuery,
  getProductByIdQuery,
  updateIsDeletedById,
  getProductByNameQuery,
  addProductStocksQuery,
  updateProductStocksQuery,
  subtractProductStocksQuery,
  addVariantStocksQuery,
  subtractVariantStocksQuery,
  addProductSoldQuery,
  subtractProductSoldQuery,
  getAllCategoryQuery,
  getCategoryByIdQuery,
  getCategoryByNameQuery,
  createNewCategoryQuery,
  updateCategoryByIdQuery,
  deleteCategoryByIdQuery,
  getAllDeletedCategoryQuery,
  updateProductImageQuery,
  getProductByFeaturedQuery,
  getDeletedProductsQuery,
  getAllActiveProductsQuery,
} = productQueries
const { getProductAlbumByIdDB } = require('./albums.services.js')

module.exports = {
  createProductDB: (category_id, product_name, display_name, display_price, product_stocks, product_description, status, isFeatured, imagePath) => {
    return new Promise(async (resolve, reject) => {
      const isExist = await module.exports.getProductByNameDB(product_name);
      if (isExist) return resolve(1);

      pool.execute(createProductQuery,
        [category_id, product_name, display_name, display_price, product_stocks, product_description, status, isFeatured, imagePath],
        (error, result) => {
          if (error) return reject(error);
          const product_id = result.insertId;
          const product = {
            product_id: product_id,
            product_name: product_name,
            display_name: display_name,
            display_price: display_price,
            status: status,
            isFeatured: isFeatured,
            product_stocks: product_stocks,
            product_description: product_description,
            display_image: imagePath.toString('base64'),
          }
          return resolve(product);
        }
      );
    })
  },
  updateProductsDB: async (category_id, display_name, display_price, product_description, status, isFeatured, display_image, product_id) => {
    return new Promise(async (resolve, reject) => {

      const findProductByID = await module.exports.getProductByIdDB(product_id);
      if (findProductByID === null) resolve(null);

      pool.execute(updateProductQuery, [category_id,
        display_name, display_price, product_description, status, isFeatured, display_image, product_id,
      ], (error, result) => {
        if (error) return reject(error)
        const updatedProduct = {
          product_id,
          display_name,
          display_price,
          product_description,
          status,
          isFeatured,
        }
        return resolve(updatedProduct);
      })
    })
  },
  deleteProductByIdDB: (product_id, action) => {
    return new Promise(async (resolve, reject) => {
      pool.execute(updateIsDeletedById, [action, product_id], (error, result) => {
        if (error) return reject(error);
        return resolve(result)
      })
    })
  },
  createVariantsDB: (product_id, variants) => {
    return new Promise((resolve, reject) => {
      variants.map(async (variant, index) => {
        await module.exports.deleteVariantsDB(product_id, variants)
        const { variant_name, variant_symbol, variant_price, variant_stocks } = variant;
        pool.execute(createVariantQuery, [index + 1, product_id, variant_name, variant_symbol, variant_price, variant_stocks], (error, result) => {
          if (error) return reject(error);
          return resolve(variants)
        })
      })
    })
  },
  createNewVariantsDB: (product_id, variants) => {
    const variantArray = new Array(variants)
    return new Promise((resolve, reject) => {
      variantArray.map(async (value, index) => {
        const checkVariant = await module.exports.getVariantByProductIdDB(product_id);
        let existingVariantId;
        if (checkVariant && checkVariant.length > 0) {
          existingVariantId = checkVariant.length
        } else {
          existingVariantId = 0
        }

        const { variant_name, variant_symbol, variant_price, variant_stocks } = value
        pool.execute(createVariantQuery, [existingVariantId + (index + 1), product_id, variant_name, variant_symbol, variant_price, variant_stocks], (error, result) => {
          if (error) return reject(error);

          return resolve(variants)
        })
      })
    })
  },
  getAllVariantsDB: () => {
    return new Promise((resolve, reject) => {
      pool.execute(getAllVariantsQuery, [], (error, result) => {
        if (error) return reject(error)
        if (result.length === 0) return resolve(null)
        return resolve(result)
      })
    })
  },
  getVariantByIdDB: (id) => {
    return new Promise((resolve, reject) => {
      pool.execute(getVariantByIdQuery, [id], (error, result) => {
        if (error) return reject(error)
        if (result.length === 0) return resolve(null)
        return resolve(result)
      })
    })
  },
  getVariantByProductIdDB: (product_id) => {
    return new Promise((resolve, reject) => {
      pool.execute(getVariantByProductIdQuery, [product_id], (error, result) => {
        if (error) return reject(error)
        if (result.length === 0) return resolve(null)
        return resolve(result)
      })
    })
  },
  updateVariantsDB: (product_id, variants) => {
    return new Promise((resolve, reject) => {
      variants.map(async (variant, index) => {
        const { id, variant_id, variant_name, variant_symbol, variant_price, variant_stocks } = variant;
        if (!id && !variant_id) {
          await module.exports.createNewVariantsDB(product_id, variant)
        }
        if (variant.variant_id && variant.id) {
          pool.execute(updateVariantQuery, [variant_name, variant_symbol, variant_price, variant_stocks, product_id, variant_id], (error, result) => {
            if (error) return reject(error)
            return resolve(result)
          })
        }
      })
    })
  },
  deleteVariantsDB: (product_id) => {
    return new Promise(async (resolve, reject) => {
      const isExist = await module.exports.getVariantByProductIdDB(product_id)
      if (isExist === null) return resolve(null)
      pool.execute(deleteVariantsQuery, [product_id], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  updateProductStocksDB: (product_id, operation, value) => {
    let Query;
    operation === 'add' ? Query = addProductStocksQuery :
      operation === 'subtract' ? Query = subtractProductStocksQuery :
        Query = updateProductStocksQuery;

    return new Promise((resolve, reject) => {
      pool.execute(Query, [value, product_id], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  updateVariantStocksDB: (variant_name, product_id, operation, quantity) => {
    let updateVariantStocksQuery;
    operation === 'add' ? updateVariantStocksQuery = addVariantStocksQuery : updateVariantStocksQuery = subtractVariantStocksQuery

    return new Promise((resolve, reject) => {
      const updateProductStocks = module.exports.updateProductStocksDB(product_id, operation, quantity)
      if (!updateProductStocks || updateProductStocks === null) return resolve(null)
      pool.execute(updateVariantStocksQuery, [quantity, variant_name, product_id], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  updateProductSoldDB: (product_id, operation, value) => {
    let updateProductQuery;
    operation === 'add' ? updateProductQuery = addProductSoldQuery : updateProductQuery = subtractProductSoldQuery
    return new Promise((resolve, reject) => {
      pool.execute(updateProductQuery, [value, product_id], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  getAllProductsDB: (category_name, active) => {
    return new Promise((resolve, reject) => {
      if (active === 'true') {
        pool.execute(getAllActiveProductsQuery, [category_name ?? null, category_name ?? null], (error, result) => {
          if (error) return reject(error)
          if (result.length === 0) {
            return resolve(null)
          } else {
            const products = result.map((product) => ({
              product_id: product.product_id,
              product_name: product.product_name,
              display_name: product.display_name,
              display_price: product.display_price,
              product_stocks: product.product_stocks,
              product_description: product.product_description,
              status: product.status,
              isFeatured: product.isFeatured,
              isDeleted: product.isDeleted,
              date_created: product.date_created,
              display_image: product.display_image.toString('base64'),
              category_id: product.category_id,
              category_name: product.category_name,
              category_image: product.category_image.toString('base64'),
            }))
            return resolve(products)
          }
        })
      } else {
        pool.execute(getAllProductsQuery, [category_name ?? null, category_name ?? null], (error, result) => {
          if (error) return reject(error)
          if (result.length === 0) {
            return resolve(null)
          } else {
            const products = result.map((product) => ({
              product_id: product.product_id,
              product_name: product.product_name,
              display_name: product.display_name,
              display_price: product.display_price,
              product_stocks: product.product_stocks,
              product_description: product.product_description,
              status: product.status,
              isFeatured: product.isFeatured,
              isDeleted: product.isDeleted,
              date_created: product.date_created,
              display_image: product.display_image.toString('base64'),
              category_id: product.category_id,
              category_name: product.category_name,
              category_image: product.category_image.toString('base64'),
            }))
            return resolve(products)
          }
        })
      }
    })
  },
  getDeletedProductsDB: () => {
    return new Promise((resolve, reject) => {
      pool.execute(getDeletedProductsQuery, [], (error, result) => {
        if (error) return reject(error);
        if (result.length === 0) resolve(null)
        return resolve(result);
      })
    })
  },
  getProductByIdDB: (id) => {
    return new Promise(async (resolve, reject) => {
      const variants = await module.exports.getVariantByProductIdDB(id);
      if (variants === null) return resolve(null)
      const albums = await getProductAlbumByIdDB(id);

      pool.execute(getProductByIdQuery, [id], (error, result) => {
        if (error) return reject(error);
        if (result.length === 0) resolve(null)

        const products = result.map((product) => ({
          product_id: product.product_id,
          product_name: product.product_name,
          display_name: product.display_name,
          display_price: product.display_price,
          product_stocks: product.product_stocks,
          product_description: product.product_description,
          status: product.status,
          isFeatured: product.isFeatured,
          isDeleted: product.isDeleted,
          date_created: product.date_created,
          display_image: product.display_image.toString('base64'),
          category_id: product.category_id,
          category_name: product.category_name,
          category_image: product.category_image.toString('base64'),
          albums: albums ? albums : null,
          variants: variants
        }))
        return resolve(products);
      })
    })
  },
  getProductByNameDB: (product_name) => {
    return new Promise((resolve, reject) => {
      pool.execute(getProductByNameQuery, [product_name], (error, result) => {
        if (error) return reject(error);
        if (result.length === 0) resolve(null)
        return resolve(result);
      })
    })
  },
  getAllCategoryDB: () => {
    return new Promise((resolve, reject) => {
      pool.execute(getAllCategoryQuery, [], (error, result) => {
        if (error) return reject(error)
        if (result.length === 0) return resolve(null)
        const categories = result.map(category => ({
          category_id: category.category_id,
          category_name: category.category_name,
          category_image: category.category_image.toString('base64')
        }))
        return resolve(categories)
      })
    })
  },
  getCategoryByIdDB: (id) => {
    return new Promise((resolve, reject) => {
      pool.execute(getCategoryByIdQuery, [id], (error, result) => {
        if (error) return reject(error)
        if (result.length === 0) return resolve(null)
        const categories = result.map(category => ({
          category_id: category.category_id,
          category_name: category.category_name,
          category_image: category.category_image.toString('base64')
        }))
        return resolve(categories)
      })
    })
  },
  getAllDeletedCategoryDB: () => {
    return new Promise((resolve, reject) => {
      pool.execute(getAllDeletedCategoryQuery, [], (error, result) => {
        if (error) return reject(error)
        if (result.length === 0) return resolve(null)
        return resolve(result)
      })
    })
  },
  getCategoryByNameDB: (name) => {
    return new Promise((resolve, reject) => {
      pool.execute(getCategoryByNameQuery, [name], (error, result) => {
        if (error) return reject(error)
        if (result.length === 0) return resolve(null)
        return resolve(result)
      })
    })
  },
  createNewCategoryDB: (category_name, category_image) => {
    return new Promise(async (resolve, reject) => {
      const isExist = await module.exports.getCategoryByNameDB(category_name)
      if (isExist) return resolve(1)
      pool.execute(createNewCategoryQuery, [category_name, category_image], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  updateCategoryByIdDB: (category_name, category_image, id) => {
    return new Promise(async (resolve, reject) => {
      // const isExist = await module.exports.getCategoryByNameDB(category_name)
      // if (isExist) return resolve(1)
      pool.execute(updateCategoryByIdQuery, [category_name, category_image, id], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  deleteCategoryByIdDB: (action, id) => {
    return new Promise(async (resolve, reject) => {
      pool.execute(deleteCategoryByIdQuery, [action, id], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  updateProductImageDB: (image, product_id) => {
    return new Promise((resolve, reject) => {
      pool.execute(updateProductImageQuery, [image, product_id], (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
    })
  },
  getProductByFeaturedDB: () => {
    return new Promise((resolve, reject) => {
      pool.execute(getProductByFeaturedQuery, [], (error, result) => {
        if (error) return reject(error)
        if (result) {
          const product = result.map((product) => ({
            product_name: product.product_name,
            product_id: product.product_id,
            display_price: product.display_price,
            display_image: product.display_image.toString('base64'),
          }
          ))
          return resolve(product);
        }
      })
    })
  },
};


