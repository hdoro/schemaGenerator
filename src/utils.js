import saveAs from 'file-saver'
import JSZip from 'jszip/dist/jszip'

export function saveFile(str, name) {
  const blob = new Blob([str], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, name)
}

const getContent = value => `export default ${JSON.stringify(value, null, 2)}`

const getIndex = keys => {
  const imports = keys.map(k => `import ${k} from './${k}.js';`).join('\n')
  const exportDeclarations = `export default [
    ${keys.join(',\n\t')}
  ]`
  return `${imports}
  
${exportDeclarations}
  `
}

export function zipAll(types) {
  const zip = new JSZip()

  const docFolder = zip.folder('documents')
  const objFolder = zip.folder('objects')

  const docKeys = []
  const objKeys = []
  
  // Add each file to the correct folder
  for (const [key, value] of Object.entries(types)) {
    if (value.type === 'document') {
      docKeys.push(key)
      docFolder.file(`${key}.js`, getContent(value))
    } else {
      objKeys.push(key)
      objFolder.file(`${key}.js`, getContent(value))
    }
  }
  
  // Create index files to pull in every doc/obj
  docFolder.file('index.js', getIndex(docKeys))
  objFolder.file('index.js', getIndex(objKeys))

  // Create the schema.js file to consolidate the schema
  // @TODO: create schema.js
  
  zip.generateAsync({ type: 'blob' }).then(function(content) {
    saveAs(content, 'schema.zip')
  })
}

export const IGNORED_TYPES = ['sanity.imageAsset']
export const STANDARD_OBJ_TYPES = ['image', 'reference', 'slug', 'span']
export const INTERNAL_PROPERTIES = [
  '_createdAt',
  '_id',
  '_rev',
  '_type',
  '_updatedAt',
  '_key'
]

export function getFields(valueObj, createEntry) {
  let fields = []
  const addField = ({ key: name, ...newFld }) => {
    fields = [...fields, { name, title: name, ...newFld }]
  }
  for (const [key, value] of Object.entries(valueObj)) {
    if (INTERNAL_PROPERTIES.indexOf(key) > -1) {
      continue
    }

    // Basic types addition
    if (typeof value === 'string') {
      addField({ key, type: value.length > 120 ? 'text' : 'string' })
    } else if (['number', 'boolean'].indexOf(typeof value) > -1) {
      addField({ key, type: typeof value })
    }
    // Dealing with arrays involves adding standalone objects and adding their types to the `of` array
    else if (Array.isArray(value)) {
      // Add standalone objects for each value in the array
      for (const child of value) {
        if (!child._type) {
          if (child !== null && typeof child === 'object') {
            console.error(
              `Error in schema (${valueObj._type}): array of inline objects. Please create a standalone object instead.`
            )
          }
          continue
        }
        const fields = getFields(child, createEntry)
        createEntry({ key: child._type, fields })
      }
      // And then discover which types are available to this array
      const arrTypes = value
        .reduce((acc, cur) => {
          if (!cur || !cur._type) {
            return [typeof cur]
          } else if (acc.indexOf(cur._type) > -1) {
            return acc
          }
          return [...acc, cur._type]
        }, [])
        .map(type => ({ type }))
      addField({ key, type: 'array', of: arrTypes })
    }
    // We're now left with objects, which can be inline or named (separate file)
    else if (value._type) {
      addField({ key, type: value._type })
      if (STANDARD_OBJ_TYPES.indexOf(value._type) > -1) {
        continue
      }
      // If it's a standalone one, we need to add it to the class
      const fields = getFields(value, createEntry)
      createEntry({ key: value._type, fields })
    } else {
      // Else just add it as a field of type 'object'
      const fields = getFields(value, createEntry)
      addField({ key, type: 'object', fields })
    }
  }
  return fields
}
