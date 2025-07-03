 # Mass-kit
 

 ## Data Generate
 
`{syntax attrs...}`

 ### syntax

 ```
number:
	X-Y   ramdom integer
	X:Y   cycle increment integer
	-- example: 1-100, 10:20, 1-, 1:, :20
timestamp:
	ts   integer of seconds
	tm   decimal of seconds.millisecond
	ms   integer of millisecond
	-- example: ts, tm, ms
string:
	<t>X-Y  ramdom length string
	<t>X:Y  cycle increment length string
	-- char table: s [A-Za-z0-9]; u [A-Z]; l [a-z];
		w [A-Za-z]; h [0-9a-f]; H [0-9A-F]; d [0-9]; 
	-- example: s5-10, w3:8, h4:12, H6:20
other:  
	uuid  uuid4() 8-4-4-4-12 format string
	A,B,C,...   choose orderly item 
	A|B|C|...   choose random item 
	choose:file random line from file
	@file       read file content
	*file       load custom generator from file
	!cmd        execute shell command and return the output
	#ID         reference the target value

```

### attr

```
- carry-in - 
	^ID     listen to the Nth emit carry-out,
			it will be advanced again.
	-- example: {2012:2023 ^1}/{1-12 ^2}/{1:31}
    #ID     set id for this tag   
```