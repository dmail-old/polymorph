# polymorph

Expressive way to declare how you function can be called

### Example

```javascript
import polymorph from 'dmail/polymorph';

var API = {
	method: polymorph(
		function withoutArguments(){

		},

		[String],
		function withStringAsFirstArgument(string){

		},

		function withOneArgumentWhichIsNotAString(arg1){

		}
	)
};
```