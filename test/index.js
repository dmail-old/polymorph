import polymorph from '../index.js';

export function suite(add){

	add("function are called dependening of their arguments length", function(){
		var first = this.spy();
		var second = this.spy();
		var third = this.spy();

		var fn = polymorph(
			function(){ first(); },
			function(a){ second(a); },
			function(a, b){ third(a, b); }
		);

		fn();
		this.calledWith(first, undefined);
		fn('foo');
		this.calledWith(second, 'foo');
		fn('foo', 'bar');
		this.calledWith(third, 'foo', 'bar');
	});

	add("signature support primitives", function(){
		var boolean = this.spy();
		var string = this.spy();
		var number = this.spy();

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

		this.calledWith(boolean, true);
		this.calledWith(string, 'foo');
		this.calledWith(number, 10);
	});

	add("signature support instanceof", function(){
		var first = this.spy();

		var CustomConstructor = function(){};
		var customConstructor = new CustomConstructor();

		var fn = polymorph(
			[CustomConstructor],
			function(a){
				first(a);
			}
		);

		fn(customConstructor);
		this.calledWith(first, customConstructor);
	});

	add("signature support isPrototypeOf", function(){
		var first = this.spy();

		var CustomObject = {};
		var customObject = Object.create(CustomObject);

		var fn = polymorph(
			[CustomObject],
			function(a){
				first(a);
			}
		);

		fn(customObject);
		this.calledWith(first, customObject);
	});

	add("signature support any thanks to hole in the array", function(){
		var first = this.spy();

		var fn = polymorph(
			[,String],
			function(a, b){
				first(a, b);
			}
		);

		fn(true, 'bar');
		this.calledWith(first, true, 'bar');
		fn(undefined, 'boo');
		this.calledWith(first, undefined, 'boo');
	});

	add('signature support rest params just not giving any schema to follow', function(){
		var first = this.spy();

		var called = false;
		var fn = polymorph(
			[String],
			function(a, b){
				first(a, b);
			}
		);

		fn('foo', 'bar');
		this.calledWith(first, 'foo', 'bar');
	});

	add("Error code EMPTY_SIGNATURE", function(){
		var fn = polymorph();

		try{
			fn();
			throw new Error('error was expected');
		}
		catch(e){
			this.equal(e.code, 'EMPTY_SIGNATURE');
		}
	});

	add("Error code EMPTY_SIGNATURE", function(){
		var fn = polymorph();

		try{
			fn();
			throw new Error('error was expected');
		}
		catch(e){
			this.equal(e.code, 'EMPTY_SIGNATURE');
		}
	});

	add("Error code NOT_ENOUGH_ARGUMENT", function(){
		var fn = polymorph(
			function(a){

			}
		);

		try{
			fn();
			throw new Error('error was expected');
		}
		catch(e){
			this.equal(e.code, 'NOT_ENOUGH_ARGUMENT');
		}
	});

	add("Error code TOO_MUCH_ARGUMENT", function(){
		var fn = polymorph(
			function(){

			}
		);

		try{
			fn('foo');
			throw new Error('error was expected');
		}
		catch(e){
			this.equal(e.code, 'TOO_MUCH_ARGUMENT');
		}
	});

	add("Error code INVALID_ARGUMENT", function(){
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
			this.equal(e.code, 'INVALID_ARGUMENT');
		}
	});
}