var _  = require('lodash');

function mergeSchemas(schemaA, schemaB) {

    var keysA = _.keys(schemaA),
        keysB = _.keys(schemaB),
        commonKeys = _.intersection(keysA, keysB),
        uniqueAKeys = _.difference(keysA, commonKeys),
        uniqueBKeys = _.difference(keysB, commonKeys);

    console.log('hello?');
    console.log(keysA);
    console.log(keysB);
    console.log(commonKeys);
    console.log(uniqueAKeys);
    console.log(uniqueBKeys);

    var finalSchema = _.reduce(commonKeys, function (schema, schemaKey) {

        schema[schemaKey] = mergeSchemaObjects(schemaA[schemaKey], schemaB[schemaKey])

        return schema;

    }, {});


    for (var key of uniqueAKeys)
        finalSchema[key] = schemaA[key];

    for (var key of uniqueBKeys)
        finalSchema[key] = schemaB[key];


    return finalSchema;

}

function mergeSchemaObjects(schemaA, schemaB) {

    var typeA = schemaA.type,
        typeB = schemaB.type,
        mainTypes = _.uniq(_.concat(typeA, typeB)),
        mainType = ( _.includes(mainTypes, 'object') ? 'object' : ( _.includes(mainTypes, 'array') ? 'array' : mainTypes[0] ) );

    console.log('mainTypes: ' + mainTypes);
    console.log('mainType: ' + mainType);

    switch (mainType) {
        case 'object':
            console.log('case: object');
            schemaObject = {
                "type": mainTypes,
                "properties": mergeSchemas(
                        schemaA.properties || {},
                        schemaB.properties || {}
                    )
            };
            break;
        case 'array':
            {
                //TODO: this is not correct/finished
                console.log('case: array');

                var schemaAItems = ( _.isArray(schemaA.items) ? schemaA.items : ( _.isObject(schemaA.items) ? [schemaA.items] : [] ) );
                var mergedItemSchemaA = _.reduce(schemaA, function (accumulatingSchema, itemSchema) {
                    return mergeSchemaObjects(accumulatingSchema, itemSchema);
                }, schemaAItems.shift());

                var schemaBItems = ( _.isArray(schemaB.items) ? schemaB.items : ( _.isObject(schemaB.items) ? [schemaB.items] : [] ) );
                var mergedItemSchemaB = _.reduce(schemaBItems, function (accumulatingSchema, itemSchema) {
                    return mergeSchemaObjects(accumulatingSchema, itemSchema);
                }, schemaBItems.shift());

                console.log('mergedItemSchemaA: ' + mergedItemSchemaA);

                schemaObject = schemaA;
                schemaObject.types = mainTypes;

                if (mergedItemSchemaA && mergedItemSchemaB) {
                    schemaObject.items = [mergeSchemaObjects(mergedItemSchemaA, mergedItemSchemaB)];
                } else {

                    if (mergedItemSchemaA)
                        schemaObject.items = [mergedItemSchemaA];

                    if (mergedItemSchemaB)
                        schemaObject.items = [mergedItemSchemaB];

                }

            }
            break;
        default:
            console.log('case: default');
            if (_.isEqual(typeA, typeB)) schemaObject = schemaA;
            else   schemaObject = {
                        "type": mainTypes
                    };
            break;
    }

    // if (_.isEqual(typeA, typeB)) {
    //
    //     var mainType = typeA;
    //
    //     if (_.isArray(typeA)) {
    //         mainType = ( _.includes(typeA, 'array') ? 'array' : mainType );
    //         mainType = ( _.includes(typeA, 'object') ? 'object' : mainType );
    //     }
    //
    //     switch (mainType) {
    //         case 'object':
    //             schemaObject = {
    //                 "type": mainType,
    //                 "properties": mergeSchemas(
    //                         schemaA.properties || {},
    //                         schemaB.properties || {}
    //                     )
    //             };
    //             break;
    //         case 'array':
    //             {
    //
    //                 var schemaAItems = schemaA.items
    //                 var mergedItemSchemaA = _.reduce(schemaA.items || [], function (accumulatingSchema, itemSchema) {
    //                     return mergeSchemaObjects(accumulatingSchema, itemSchema);
    //                 }, {});
    //
    //                 var mergedItemSchemaB = _.reduce(schemaB.items || [], function (accumulatingSchema, itemSchema) {
    //                     return mergeSchemaObjects(accumulatingSchema, itemSchema);
    //                 }, {});
    //
    //                 console.log(mergedItemSchemaA);
    //
    //                 schemaObject = schemaA;
    //                 schemaObject.items = [mergeSchemas(mergedItemSchemaA, mergedItemSchemaB)];
    //             }
    //             break;
    //         default:
    //             schemaObject = schemaA;
    //             break;
    //     }
    //
    // } else {
    //
    //     var mainType = _.uniq(_.concat(typeA, typeB));
    //     console.log(mainType);
    //     if (_.includes(mainType, 'object')) {
    //
    //         schemaObject = {
    //             "type": mainType,
    //             "properties": mergeSchemas(
    //                     schemaA.properties || {},
    //                     schemaB.properties || {}
    //                 )
    //         };
    //
    //     } else if (_.includes(mainType, 'array')) {
    //
    //         var mergedItemSchemaA = _.reduce(schemaA.items || [], function (accumulatingSchema, itemSchema) {
    //             return mergeSchemaObjects(accumulatingSchema, itemSchema);
    //         }, {})
    //
    //         var mergedItemSchemaB = _.reduce(schemaB.items || [], function (accumulatingSchema, itemSchema) {
    //             return mergeSchemaObjects(accumulatingSchema, itemSchema);
    //         }, {})
    //
    //         schemaObject = {
    //             "type": mainType,
    //             "items": [mergeSchemas(mergedItemSchemaA, mergedItemSchemaB)]
    //         };
    //
    //     } else {
    //         schemaObject = {
    //             "type": mainType
    //         };
    //     }
    //
    // }

    return schemaObject;


}

module.exports = function (schemaA, schemaB) {
    if (schemaA['$schema'] && schemaB['$schema']) {

        return mergeSchemaObjects(schemaA, schemaB);

        // var mainType = _.uniq(_.concat(schemaA.type, schemaB.type));
        //
        // var mergedSchema = schemaA;
        //
        // if (_.includes(mainType, 'object')) {
        //     console.log('hello?');
        //     mergedSchema.type = mainType;
        //     mergedSchema.properties = mergeSchemas(
        //             schemaA.properties || {},
        //             schemaB.properties || {}
        //         );
        //
        //     return mergedSchema;
        //
        // }

    }
}
