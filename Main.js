
function DrawCodeEditor(codeEditor){
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    var fontSize = window.innerHeight/20;
    ctx.font = fontSize+'px Arial';
    var x = fontSize;
    var y = fontSize;

    ctx.fillStyle = 'white';
    for(var c of codeEditor.value){
        if(c=='\n'){
            y+=fontSize*1.5;
            x=fontSize;
        }
        else if(c=='\t'){
            x+=ctx.measureText(' ').width*4;
        }
        else{
            ctx.fillText(c, x, y);
            x+=ctx.measureText(c).width;
        }
        
    }
}

function CreateCanvas(parent){
    var canvas = document.createElement('canvas');
    parent.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return canvas.getContext('2d');
}

function GetRect(outerRect, rect){
    return [
        outerRect[0]+rect[0]*outerRect[2], 
        outerRect[1]+rect[1]*outerRect[3], 
        outerRect[2]*rect[2], 
        outerRect[3]*rect[3]
    ];
}

function ContainsPoint(rect, point){
    return point[0]>rect[0] && point[0]<rect[0]+rect[2] && point[1]>rect[1] && point[1]<rect[1]+rect[3];
}

function Button(menuID, rect, name, onclick){
    var r;
    var pressed = false;
    function Draw(e){
        if(pressed){ 
            ctx.fillStyle='rgb(0,255,255)'; 
        }
        else {
            ctx.fillStyle='rgb(220,220,220)';
        }
        r = GetRect(e.outerRect, rect);
        ctx.fillRect(r[0], r[1], r[2], r[3]);
        ctx.strokeStyle = '2px black';
        ctx.strokeRect(r[0], r[1], r[2], r[3]);
        ctx.fillStyle = 'black';
        var fontSize = r[3]*0.5;
        ctx.font = fontSize +'px Arial';
        var textSize = ctx.measureText(name);
        ctx.fillText(name, r[0]+r[2]/2-textSize.width/2, r[1]+r[3]/2-fontSize/2+fontSize);
    }
    function MouseDown(e){
        if(!e.use && ContainsPoint(r, e.mouse)){
            if(onclick) requestAnimationFrame(onclick);
            pressed = true;
            e.use = true;
        }
    }
    function MouseUp(e){
        pressed = false;
    }
    var button = {Draw, MouseDown, MouseUp, menuID};
    gui.push(button);
    return button;
}

function CallGUI(funcname, param){
    for(var g of gui){
        var func = g[funcname];
        if(func) func(param);
    }
}

function CallGUIReverse(funcname, param){
    for(var i=gui.length-1; i>=0; i--){
        var func = gui[i][funcname];
        if(func) func(param);
    }
}

function Draw(){
    DrawCodeEditor(codeEditor);
    CallGUI('Draw', {outerRect:[0,0,ctx.canvas.width,ctx.canvas.height]})
}

function Resize(){
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    Draw();
}

function TouchStart(e){
    CallGUIReverse('MouseDown', {mouse:[e.pageX, e.pageY]});
    Draw();
}

function TouchEnd(e){
    CallGUIReverse('MouseDown', {});
    Draw();
}

function MouseDown(e){
    CallGUIReverse('MouseDown', {mouse:[e.clientX, e.clientY]});
    Draw();
}

function MouseUp(e){
    CallGUIReverse('MouseUp', {});
    Draw();
}

function Keyboard(menuID, rect){
    var keys = [[]];
    function NewLine(){
        keys.push([]);
    }

    function AddKey(key){
        keys[keys.length-1].push(key);
    }

    function AddInsertChar(obj, char){
        AddKey({name:char, onclick:()=>{obj.value+=char}, width:1});
    }

    function AddInsertChars(obj, chars){
        for(var c of chars){
            AddInsertChar(obj, c);
        }
    }

    function Create(){
        var height = rect[3]/keys.length;
        for(var y=0;y<keys.length;y++){
            var totalLength = 0;
            for(var k of keys[y]){
                totalLength+=k.width;
            }
            var width = rect[2]/totalLength;
            var px = 0;
            for(var x=0;x<keys[y].length;x++){
                var k = keys[y][x];
                Button(menuID, [rect[0]+px*width, rect[1]+y*height, width*k.width, height], k.name, k.onclick);
                px+=k.width;
            }
        }
    }
    return {AddInsertChars, Create, NewLine, AddKey};
}

function NormalKeyboard(menuID, rect, obj, shift){
    var keyboard = Keyboard(menuID, rect);
    if(shift)
        keyboard.AddInsertChars(obj, '!@£$%^&*()_+');
    else
        keyboard.AddInsertChars(obj, '1234567890-=');
    keyboard.AddKey({name:'<=', onclick:()=>{
        if(obj.value.length>0){
            obj.value = obj.value.substring(0, obj.value.length-1);
        }
    }, width:4});
    keyboard.NewLine();
    if(shift)
        keyboard.AddInsertChars(obj, 'QWERTYUIOP{}');
    else
        keyboard.AddInsertChars(obj, 'qwertyuiop[]');
    keyboard.AddKey({name:'Tab', onclick:()=>obj.value+='\t', width:4});
    keyboard.NewLine();
    if(shift)
        keyboard.AddInsertChars(obj, 'ASDFGHJKL:"|');
    else
        keyboard.AddInsertChars(obj, "asdfghjkl;'\\");
    keyboard.AddKey({name:'Enter', onclick:()=>obj.value+='\n', width:4});
    keyboard.NewLine();
    if(shift)
        keyboard.AddInsertChars(obj, '~ZXCVBNM<>?');
    else
        keyboard.AddInsertChars(obj, '`zxcvbnm,./');
    keyboard.AddKey({name:'Shift', onclick:()=>NormalKeyboard(menuID, rect, obj, !shift), width:4});
    keyboard.NewLine();
    keyboard.AddKey({name:'Play', onclick:()=>{
        document.body.innerHTML = '';
        eval(obj.value);
    }, width:4});
    keyboard.AddKey({name:'Space', onclick:()=>obj.value+=' ', width:6});
    keyboard.AddKey({name:'<<', onclick:undefined, width:1});
    keyboard.AddKey({name:'/\\', onclick:undefined, width:1});
    keyboard.AddKey({name:'\\/', onclick:undefined, width:1});
    keyboard.AddKey({name:'>>', onclick:undefined, width:1});
    keyboard.Create();
}

var ctx = CreateCanvas(document.body);
var gui = [];
document.body.style.margin = '0px';
document.body.style.overflow = 'hidden';

addEventListener('resize', Resize);
addEventListener('mousedown', MouseDown);
addEventListener('mouseup', MouseUp);
addEventListener('touchstart', TouchStart);
addEventListener('touchend', TouchEnd);

var codeEditor = {value:''};
NormalKeyboard(1, [0,0.4,1,0.6], codeEditor, false);
Draw();
