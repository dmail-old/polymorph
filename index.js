import SignatureList from './lib/signature-list.js';

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