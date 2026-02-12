#!/usr/bin/env node
/*
 * Schema Validation CLI Tool
 * 
 * Validates connector schemas for type consistency issues that could
 * cause runtime errors in production.
 * 
 * Usage:
 *   node validateSchemas.js <connector-directory>
 *   node validateSchemas.js ./connectors/my-connector
 * 
 * Exit codes:
 *   0 - All schemas valid
 *   1 - Validation errors found
 *   2 - Invalid arguments or directory not found
 */

var fs = require('fs');
var path = require('path');
var validateInputTypes = require('./bindConnectors/validateInputTypes');

function findSchemaFiles(dir, files) {
	files = files || [];
	
	try {
		var items = fs.readdirSync(dir);
		
		items.forEach(function(item) {
			var fullPath = path.join(dir, item);
			var stat = fs.statSync(fullPath);
			
			if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
				findSchemaFiles(fullPath, files);
			} else if (item === 'schema.js') {
				files.push(fullPath);
			}
		});
	} catch (e) {
		// Directory not accessible
	}
	
	return files;
}

function findGlobalSchema(dir) {
	var globalSchemaPath = path.join(dir, 'global_schema.js');
	if (fs.existsSync(globalSchemaPath)) {
		return globalSchemaPath;
	}
	
	// Check in connectors subdirectory
	var connectorsDir = path.join(dir, 'connectors');
	if (fs.existsSync(connectorsDir)) {
		var subdirs = fs.readdirSync(connectorsDir);
		for (var i = 0; i < subdirs.length; i++) {
			var subGlobalPath = path.join(connectorsDir, subdirs[i], 'global_schema.js');
			if (fs.existsSync(subGlobalPath)) {
				return subGlobalPath;
			}
		}
	}
	
	return null;
}

function validateConnector(connectorDir) {
	var errors = [];
	var schemaFiles = findSchemaFiles(connectorDir);
	var globalSchemaPath = findGlobalSchema(connectorDir);
	var globalSchema = null;
	
	// Load global schema if exists
	if (globalSchemaPath) {
		try {
			globalSchema = require(path.resolve(globalSchemaPath));
			var globalErrors = validateInputTypes.validateSchemaDefaults(
				globalSchema.input || {},
				'global_schema'
			);
			if (globalErrors.length > 0) {
				errors.push({
					file: globalSchemaPath,
					errors: globalErrors
				});
			}
		} catch (e) {
			console.error('Warning: Could not load global schema:', globalSchemaPath, e.message);
		}
	}
	
	// Validate each schema file
	schemaFiles.forEach(function(schemaFile) {
		try {
			// Clear require cache to ensure fresh load
			delete require.cache[require.resolve(path.resolve(schemaFile))];
			var schema = require(path.resolve(schemaFile));
			
			var schemaErrors = validateInputTypes.validateSchemaDefaults(
				schema.input || {},
				path.relative(connectorDir, schemaFile)
			);
			
			if (schemaErrors.length > 0) {
				errors.push({
					file: schemaFile,
					errors: schemaErrors
				});
			}
		} catch (e) {
			console.error('Warning: Could not load schema:', schemaFile, e.message);
		}
	});
	
	return errors;
}

function main() {
	var args = process.argv.slice(2);
	
	if (args.length === 0) {
		console.error('Usage: node validateSchemas.js <connector-directory>');
		console.error('');
		console.error('Validates connector schemas for type consistency issues.');
		process.exit(2);
	}
	
	var connectorDir = path.resolve(args[0]);
	
	if (!fs.existsSync(connectorDir)) {
		console.error('Error: Directory not found:', connectorDir);
		process.exit(2);
	}
	
	console.log('Validating schemas in:', connectorDir);
	console.log('');
	
	var errors = validateConnector(connectorDir);
	
	if (errors.length === 0) {
		console.log('✓ All schemas valid - no type mismatches found');
		process.exit(0);
	} else {
		console.error('✗ Schema validation errors found:\n');
		
		errors.forEach(function(fileErrors) {
			console.error('  ' + fileErrors.file + ':');
			fileErrors.errors.forEach(function(error) {
				console.error('    - ' + error);
			});
			console.error('');
		});
		
		var totalErrors = errors.reduce(function(sum, f) { return sum + f.errors.length; }, 0);
		console.error('Total: ' + totalErrors + ' error(s) in ' + errors.length + ' file(s)');
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

module.exports = {
	validateConnector: validateConnector,
	findSchemaFiles: findSchemaFiles
};
