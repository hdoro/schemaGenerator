const fs = require('fs')
const dataset = require('../src/.data/sanity.json')

const IGNORED_TYPES = ['sanity.imageAsset']
const STANDARD_OBJ_TYPES = ['image', 'reference', 'slug', 'span']
const INTERNAL_PROPERTIES = [
  '_createdAt',
  '_id',
  '_rev',
  '_type',
  '_updatedAt',
  '_key'
]

class SchemaGenerator {
  constructor(dataset) {
    this.dataset = dataset
    this.documents = {}
    this.objects = {}
  }

  createObject({ key, ...rest }) {
    if (this.objects[key]) {
      this.objects[key] = {
        ...this.objects[key],
        ...rest
      }
      return
    }
    this.objects[key] = { name: key, title: key, type: 'object', ...rest }
  }

  getFields(valueObj) {
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
          const fields = this.getFields(child)
          this.createObject({ key: child._type, fields })
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
        const fields = this.getFields(value)
        this.createObject({ key: value._type, fields })
      } else {
        // Else just add it as a field of type 'object'
        const fields = this.getFields(value)
        addField({ key, type: 'object', fields })
      }
    }
    return fields
  }

  getDocumentTypes() {
    for (const doc of this.dataset) {
      if (IGNORED_TYPES.indexOf(doc._type) > -1) {
        continue
      }
      const fields = this.getFields(doc)
      this.documents[doc._type] = Object.assign(
        {},
        this.documents[doc._type] || {},
        { name: doc._type, title: doc._type, type: 'document', fields }
      )
    }
  }

  getSchema() {
    this.getDocumentTypes()
    return {
      documents: this.documents,
      objects: this.objects
    }
  }
}

const schema = new SchemaGenerator(dataset).getSchema()

fs.writeFile(
  './schemaGenerator/schema.json',
  JSON.stringify(schema, null, 2),
  {
    encoding: 'utf-8'
  },
  err => {
    if (err) {
      console.error(err)
    } else {
      console.info('✅ successfully generated!')
    }
  }
)
