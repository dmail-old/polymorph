import proto from 'proto';

function createNotEnoughArgumentError(actual, expected){
	var error = new TypeError('NOT_ENOUGH_ARGUMENT: signature expect ' + expected + ' arguments, ' + actual + ' given');
	error.code = 'NOT_ENOUGH_ARGUMENT';
	return error;
}

function createTooMuchArgumentError(actual, expected){
	var error = new TypeError('TOO_MUCH_ARGUMENT: signature expect ' + expected + ' arguments, ' + actual + '  given');
	error.code = 'TOO_MUCH_ARGUMENT';
	return error;
}

function createInvalidArgumentError(actual, expected){
	var error = new TypeError('INVALID_ARGUMENT: signature expect ' + expected + ' value, ' + actual + ' given');
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
			if( args.length < this.exactLengthExpected ){
				throw createNotEnoughArgumentError(args.length, this.exactLengthExpected);
			}
			else if( args.length > this.exactLengthExpected ){
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

	listAvailableLength(){
		return this.signatures.map(function(signature){
			return signature.priority;
		});
	},

	getModelName(model){
		if( model.hasOwnProperty('name') ){
			return model.name;
		}
		return String(model);
	},

	listAvailableModelNamesForArgumentAt(index){
		var availableValues = this.signatures.map(function(signature){
			return signature.schema[index];
		});

		availableValues = availableValues.map(this.getModelName, this);

		return availableValues;
	},

	getValueName(value){
		if( value.constructor ) return this.getModelName(value.constructor);
		return this.getModelName(Object.getPrototypeOf(value));
	},

	minLength(){
		var availableLengthList = this.listAvailableLength();

		return Math.min.apply(null, availableLengthList);
	},

	maxLength(){
		var availableLengthList = this.listAvailableLength();

		return Math.max.apply(null, availableLengthList);
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

	applySignature(bind, args){
		var signature = this.findSignature(args);

		if( signature ){
			return signature.fn.apply(bind, args);
		}
		else{
			var error = this.lastViolatedRule;

			if( error ){
				if( error.code === 'NOT_ENOUGH_ARGUMENT' ){
					error.message = 'NOT_ENOUGH_ARGUMENT : min ' + this.minLength() + 'arguments expected, ' + args.length + 'given';
				}
				else if( error.code === 'TOO_MUCH_ARGUMENT' ){
					error.message = 'TOO_MUCH_ARGUMENT : max ' + this.maxLength() + 'arguments expected, ' + args.length + ' given';
				}
				else if( error.code === 'INVALID_ARGUMENT' ){
					var index = error.argumentIndex;
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

					var availableNames = this.listAvailableModelNamesForArgumentAt(index);
					var valueName = this.getValueName(args[index]);
					var availableNamesString = availableNames.length === 1 ? 'a ' + availableNames : 'one of ' + availableNames;

					error.message = 'INVALID_ARGUMENT : the ' + name + ' must be ' + availableNamesString + ', ' + valueName + ' given';
				}
			}
			else{
				error = new Error('no signature match');
				error.code = 'EMPTY_SIGNATURE';
			}

			throw error;
		}
	},

	createFunction(){
		var signatureList = this;

		// commented for the moment : would allow lastsignature to be matched if extra params are given
		// allow lastSignature to match minlength instead of exactlength
		// var lastSignature = this.signatures[this.signatures.length - 1];
		// lastSignature.minLengthExpected = lastSignature.exactLengthExpected;

		var polymorphed = function(){
			return signatureList.applySignature(this, arguments);
		};

		return polymorphed;
	}
});

export default SignatureList;