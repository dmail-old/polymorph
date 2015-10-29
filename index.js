/*
TODO : externalize object into the lib folder
TODO : create error code for the typeError, 'TOO_MUCH_ARGUMENT', 'NOT_ENOUGH_ARGUMENT', 'INVALID_ARGUMENT'
*/

import proto from 'proto';

function createNotEnoughArgumentError(actual, expected){
	var error = new TypeError('NOT_ENOUGH_ARGUMENT: signature expect min ' + expected + ' arguments, ' + actual + ' given');
	error.code = 'NOT_ENOUGH_ARGUMENT';
	return error;
}

function createTooMuchArgumentError(actual, expected){
	var error = new TypeError('TOO_MUCH_ARGUMENT: signature expect max ' + expected + ' arguments, ' + actual + '  given');
	error.code = 'TOO_MUCH_ARGUMENT';
	return error;
}

function createInvalidArgumentError(actual, expected){
	var error = new TypeError('INVALID_ARGUMENT: ' + name + 'can be ' + expected + ' but not ' + actual);
	error.code = 'INVALID_ARGUMENT';
	return error;
}

var FunctionSignature = proto.extend({
	minLengthExpected: undefined,
	exactLengthExpected: undefined,

	constructor(fn, schema){
		this.fn = fn;
		if( schema ){
			this.schema = schema;
		}
		// when we don't care about arguments passed
		else{
			this.exactLengthExpected = fn.length;
		}
	},

	get priority(){
		if( this.schema ) return this.schema.length;
		if( typeof this.minLengthExpected === 'number' ) return this.minLengthExpected;
		return this.exactLengthExpected;
	},

	match(arg, index){
		if( this.schema ){
			var schema = this.schema[index];

			if( schema === undefined ){
				return arg === schema;
			}
			else if( schema === null ){
				return arg === schema;
			}
			else{
				if( schema === String ){
					return typeof arg === 'string';
				}
				else if( schema === Number ){
					return typeof arg === 'number';
				}
				else if( schema === Boolean ){
					return typeof arg === 'boolean';
				}
				else if( schema === Symbol ){
					/* jshint ignore:start */
					return typeof arg === 'symbol';
					/* jshint ignore:end */
				}
				else if( typeof schema === 'object' ){
					return schema.isPrototypeOf(arg) || schema === arg;
				}
				else if( typeof schema === 'function' ){
					return arg instanceof schema || schema === arg;
				}
				else{
					return false;
				}
			}
		}
		else{
			return true;
		}
	},

	matchAll(args){
		if( typeof this.minLengthExpected === 'number' ){
			if( args.length < this.minLengthExpected ){
				throw createNotEnoughArgumentError(args.length, this.minLengthExpected);
			}
		}
		else if( typeof this.exactLengthExpected === 'number' ){
			if( args.length !== this.exactLengthExpected ){
				throw createTooMuchArgumentError(args.length, this.exactLengthExpected);
			}
		}
		// because using forEach and not checking the length, extra params are ok by default and holes in schema are always true
		else{
			this.schema.forEach(function(schema, index){
				// TODO : move error throwing to match method
				if( false === this.match(args[index], index) ){
					var error = createInvalidArgumentError(args[index], schema);
					error.argumentIndex = index;
					throw error;
				}
			}, this);
		}

		return true;
	}
});

var SignatureList = proto.extend({
	constructor(){
		this.signatures = [];
	},

	add(fn, argumentsSchema){
		var signature = FunctionSignature.create(fn, argumentsSchema);
		this.signatures.push(signature);

		// keep signature sorted to match simplest first, it's part of the logic
		// because the last signature will be matched even if there is extra arguments passed to it
		this.signatures = this.signatures.sort(function(a, b){
			return a.priority - b.priority;
		});
	},

	matchSignature(signature, args){
		return signature.matchAll(args);
	},

	findSignature(args){
		this.lastViolatedRule = null;

		return this.signatures.find(function(signature){
			try{
				this.matchSignature(signature, args);
				return true;
			}
			catch(e){
				this.lastViolatedRule = e;
				return false;
			}
		}, this);
	},

	applySignature(args){
		var signature = this.findSignature(args);

		if( signature ){
			return signature.fn.apply(this, args);
		}
		else{
			/*
			if( this.lastViolatedRule.code === 'INVALID_ARGUMENT' ){
				var index = this.lastViolatedRule.argumentIndex;
				var name;

				if( index === 0 ){
					name = 'first argument';
				}
				else if( index === 1 ){
					name = 'second argument';
				}
				else{
					name = 'argument n°' + index;
				}

				var availableValues = this.signatures.map(function(signature){
					return signature.schema[index];
				});
				var value = args[index];

				this.lastViolatedRule.message = name + ' can be ' + availableValues + ' but not ' + value;
			}
			*/

			throw this.lastViolatedRule;
		}
	},

	createFunction(){
		var signatureList = this;

		// commented for the moment : would allow lastsignature to be matched if extra params are given
		// allow lastSignature to match minlength instead of exactlength
		// var lastSignature = this.signatures[this.signatures.length - 1];
		// lastSignature.minLengthExpected = lastSignature.exactLengthExpected;

		var polymorphed = function(){
			return signatureList.applySignature(arguments);
		};

		return polymorphed;
	}
});

function convertArgumentsIntoSignatures(args){
	var signatures = [];

	var i = 0, j = args.length, arg, signature;

	for(;i<j;i++){
		arg = args[i];

		if( typeof arg === 'function' ){
			signature = {
				fn: arg
			};
			signatures.push(signature);
		}
		else if( typeof arg === 'object' && i < j-1 ){
			i++;
			signature = {
				fn: args[i],
				schema: arg
			};
			signatures.push(signature);
		}
	}

	return signatures;
}

function polymorph(){
	var polymorphed = SignatureList.create();

	convertArgumentsIntoSignatures(arguments).forEach(function(signature){
		polymorphed.add(signature.fn, signature.schema);
	});

	return polymorphed.createFunction();
}

export default polymorph;