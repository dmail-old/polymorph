import proto from 'proto';

var FunctionSignature = proto.extend({
	constructor(fn, schema){
		this.fn = fn;
		this.schema = schema;
	},

	match(args){
		// when I've no clue of what typeof argument is expected, just consider arguments length
		if( !this.schema ){
			if( this.fn.length !== args.length ){
				return false;
			}
			else{
				return true;
			}
		}
		else{
			// hole in the schema array won't call the function and as such, will be considered as valid
			// you can allow use [undefined, value, undefined, value]
			return this.schema.every(function(argSchema, index){
				var arg = args[index];

				if( argSchema === undefined ){
					return arg === argSchema;
				}
				else if( argSchema === null ){
					return arg === argSchema;
				}
				else if( typeof arg === 'object' ){
					return argSchema.isPrototypeOf(index) || argSchema === arg;
				}
				else{
					return argSchema instanceof arg || argSchema == arg;
				}
			});
		}
	}
});

var SignatureList = proto.extend({
	constructor(){
		this.signatures = [];
	},

	add(fn, argumentsSchema){
		var signature = FunctionSignature.create(fn, argumentsSchema);
		this.signatures.push(signature);
	},

	createFunction(){
		var signatureList = this;
		var polymorphed = function(){
			var args = arguments;
			var signature = signatureList.signatures.find(function(signature){
				return signature.match(args);
			});

			if( signature ){
				return signature.apply(this, args);
			}
			else{
				throw new TypeError('your function signature does not match any expected signature');
			}
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