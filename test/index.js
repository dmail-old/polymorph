import polymorph from '../index.js';

export function suite(add){

	add("function are called dependening of their arguments length", function(test){
		var first = test.spy();
		var second = test.spy();
		var third = test.spy();

		var fn = polymorph(
			function(){ first(); },
			function(a){ second(a); },
			function(a, b){ third(a, b); }
		);

		fn();
		test.calledWith(first, undefined);
		fn('foo');
		test.calledWith(second, 'foo');
		fn('foo', 'bar');
		test.calledWith(third, 'foo', 'bar');
	});

	add("signature support primitives", function(test){
		var boolean = test.spy();
		var string = test.spy();
		var number = test.spy();

		var fn = polymorph(
			[Boolean],
			function(a){ boolean(a); },
			[String],
			function(a){ string(a); },
			[Number],
			function(a){ number(a); }
		);

		fn(true);
		fn('foo');
		fn(10);

		test.calledWith(boolean, true);
		test.calledWith(string, 'foo');
		test.calledWith(number, 10);
	});

	add("signature support instanceof", function(test){
		var first = test.spy();

		var CustomConstructor = function(){};
		var customConstructor = new CustomConstructor();

		var fn = polymorph(
			[CustomConstructor],
			function(a){
				first(a);
			}
		);

		fn(customConstructor);
		test.calledWith(first, customConstructor);
	});

	add("signature support isPrototypeOf", function(test){
		var first = test.spy();

		var CustomObject = {};
		var customObject = Object.create(CustomObject);

		var fn = polymorph(
			[CustomObject],
			function(a){
				first(a);
			}
		);

		fn(customObject);
		test.calledWith(first, customObject);
	});

	add("signature support any thanks to hole in the array", function(test){
		var first = test.spy();

		var fn = polymorph(
			[,String],
			function(a, b){
				first(a, b);
			}
		);

		fn(true, 'bar');
		test.calledWith(first, true, 'bar');
		fn(undefined, 'boo');
		test.calledWith(first, undefined, 'boo');
	});

	add('signature support rest params just not giving any schema to follow', function(test){
		var first = test.spy();

		var called = false;
		var fn = polymorph(
			[String],
			function(a, b){
				first(a, b);
			}
		);

		fn('foo', 'bar');
		test.calledWith(first, 'foo', 'bar');
	});

	add("Error code EMPTY_SIGNATURE", function(test){
		var fn = polymorph();

		try{
			fn();
			throw new Error('error was expected');
		}
		catch(e){
			test.equal(e.code, 'EMPTY_SIGNATURE');
		}
	});

	add("Error code EMPTY_SIGNATURE", function(test){
		var fn = polymorph();

		try{
			fn();
			throw new Error('error was expected');
		}
		catch(e){
			test.equal(e.code, 'EMPTY_SIGNATURE');
		}
	});

	add("Error code NOT_ENOUGH_ARGUMENT", function(test){
		var fn = polymorph(
			function(a){

			}
		);

		try{
			fn();
			throw new Error('error was expected');
		}
		catch(e){
			test.equal(e.code, 'NOT_ENOUGH_ARGUMENT');
		}
	});

	add("Error code TOO_MUCH_ARGUMENT", function(test){
		var fn = polymorph(
			function(){

			}
		);

		try{
			fn('foo');
			throw new Error('error was expected');
		}
		catch(e){
			test.equal(e.code, 'TOO_MUCH_ARGUMENT');
		}
	});

	add("Error code INVALID_ARGUMENT", function(test){
		var fn = polymorph(
			[String],
			function(){

			}
		);

		try{
			fn(10);
			throw new Error('error was expected');
		}
		catch(e){
			test.equal(e.code, 'INVALID_ARGUMENT');
		}
	});
}