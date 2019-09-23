var sw=20,  //一个方块的宽
    sh=20,  //一个方块的高
    tr=30,  //行数
    td=30;  //列数

var snake = null;//蛇的实例
     food = null;//食物的实例
     game = null;//游戏的实例

//方块构造函数
function Square(x,y,classname){
	// 用1~10代替0~400的宽高
	this.x = x*sw;
	this.y = y*sh;
	this.class=classname;

	this.viewContent = document.createElement('div'); //方块对应的DOM元素
	this.viewContent.className = this.class;
	this.parent = document.getElementById('snakeWrap'); //方块的父级
}
Square.prototype.create = function(){ // 创建方块DOM
	this.viewContent.style.position = 'absolute';
	this.viewContent.style.width = sw + 'px';
	this.viewContent.style.height = sh + 'px';
	this.viewContent.style.left = this.x + 'px';
	this.viewContent.style.top = this.y + 'px';

	this.parent.appendChild(this.viewContent);

};
Square.prototype.remove=function(){
	this.parent.removeChild(this.viewContent);
};

//蛇
function Snake(){
	this.head=null; //存一下蛇头的信息
	this.tail=null; //存一下蛇尾的信息
	this.pos=[];//存储蛇身上每一个方块的位置

	this.directionNum={ //存储蛇走的方向，用一个对象来表示
		left:{
			x:-1,
			y:0,
			rotate:180
		},
		right:{
			x:1,
			y:0,
			rotate:0
		},
		up:{
			x:0,
			y:-1,
			rotate:-90
		},
		down:{
			x:0,
			y:1,
			rotate:90
		}
	}
}
Snake.prototype.init = function(){
	//创建蛇头
	var snakeHead = new Square(2,0,'snakeHead');
	snakeHead.create();
	this.head=snakeHead; //存储蛇头信息
	this.pos.push([2,0]); //把蛇头的位置存起来

	//创建蛇身体1
    var snakeBody1 = new Square(1,0,'snakeBody');
    snakeBody1.create();
    this.pos.push([1,0]);

    //创建身体2
    var snakeBody2 = new Square(0,0,'snakeBody');
    snakeBody2.create();
    this.tail=snakeBody2;
    this.pos.push([0,0]);
    

    //形成链表关系
    snakeHead.last=null;
    snakeHead.next=snakeBody1;

    snakeBody1.last=snakeHead;
    snakeBody1.next=snakeBody2;

    snakeBody2.last=snakeBody1;
    snakeBody2.next=null;

    //通过一条属性用来表达蛇走的方向，默认往右走
    this.direction=this.directionNum.right;

}

//用来获取蛇头下一个位置对应的元素，根据元素做不同的事情
Snake.prototype.getNextPos=function(){
	var nextPos=[ //蛇头要走的下一个点的坐标
	      this.head.x/sw+this.direction.x,
	      this.head.y/sh+this.direction.y
	      ]
	//下个点是自己，代表撞到了自己，游戏结束
	var selfColied = false; //是否撞到自己
	this.pos.forEach(function(value){
		if(value[0]==nextPos[0] && value[1]==nextPos[1]){
			/*数组中的两个数据都相等，说明下一个点要撞上了*/
			selfColied = true;
		}
	});
	if(selfColied){
		console.log("撞到自己了!");
		this.strategies.die();
		return;
	}
	//下个点是墙，游戏结束
	if(nextPos[0]<0 || nextPos[1]<0 || nextPos[0]>td-1 || nextPos[1]>tr-1){
		console.log("撞墙了！");

		//避免strategies中的this指向的实例变成this.strategies
		//因为strategies是一个对象,所以用call,因为谁调用方法this指向谁
		//括号中的this是实例，这样等于实例调用了die和move方法
		this.strategies.die.call(this); 
		return;
	}
	//下个点是食物，吃下身体变大
	if(food && food.pos[0]==nextPos[0] && food.pos[1]==nextPos[1]){
	this.strategies.eat.call(this);
	}
	//下个点什么都不是，走
	this.strategies.move.call(this);
};

//处理碰撞后要做的事;
Snake.prototype.strategies = {  //这个属性是一个对象，此时this是指向实例
	move:function(format){ //这个参数用于决定要不要删除最后一个方块，即蛇尾
		//创建一个新的身体(在旧蛇头的位置)
		var newBody = new Square(this.head.x/sw,this.head.y/sh,'snakeBody');
		//更新链表关系
		newBody.next = this.head.next;
		newBody.next.last = newBody;
		newBody.last = null;

		this.head.remove(); //删除旧蛇头
		newBody.create();

		//创建新蛇头，等于下一个要碰到的点
		var newHead = new Square(this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y,'snakeHead');
		//更新链表关系
		newHead.next=newBody;
		newHead.last=null;
		newBody.last=newHead;
		newHead.viewContent.style.transform='rotate('+this.direction.rotate+'deg)';
		newHead.create();	

		//蛇身上的每一个坐标也要更新
		this.pos.splice(0,0,[this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y]);
		this.head = newHead; //更新蛇头

		if(!format){  //format值为fasle,那么需要删除蛇尾,同时更新信息
			this.tail.remove();
			this.tail=this.tail.last;

			this.pos.pop();
		}
	},
	eat:function(){  //如果下一个是食物，那么就不删除蛇头，相当于蛇变长了
		this.strategies.move.call(this,true);
		createFood();
		game.score++;
	},
	die:function(){
		game.over();
	}
}


snake = new Snake();


//创建食物
function createFood(){
	//食物小方块的随机坐标
	var x=null;
	var y=null;

	var include = true; //循环跳出的条件
	while(include){
		x=Math.round(Math.random()*(td-1));
		y=Math.round(Math.random()*(tr-1));

		snake.pos.forEach(function(value){
		if(x!=value[0] && y!=value[1]){
			include=false;
		}
		});
	}
	//生成食物
		food = new Square(x,y,'food');
		food.pos=[x,y];

		var foodDom=document.querySelector('.food');
		if(foodDom){
			foodDom.style.left=x*sw+'px';
			foodDom.style.top=y*sh+'px';
		}else{
			food.create();
		}				
}

//创建游戏逻辑，给玩家操作方法
function Game(){
	this.timer = null;
	this.score = 0;
}
Game.prototype.init=function(){
		snake.init();
        //snake.getNextPos();
        createFood();

        document.onkeydown=function(ev){
        	if(ev.which==37 && snake.direction!=snake.directionNum.right){
        		snake.direction=snake.directionNum.left;
        	}else if(ev.which==38 && snake.direction!=snake.directionNum.down)
        	{
        		snake.direction=snake.directionNum.up;
        	}else if(ev.which==39 && snake.direction!=snake.directionNum.left)
        	{
        		snake.direction=snake.directionNum.right;
        	}else if(ev.which==40 && snake.direction!=snake.directionNum.up)
        	{
        		snake.direction=snake.directionNum.down;
        	}
        }
        this.start();

}
Game.prototype.start=function(){
	this.timer=setInterval(function(){
		snake.getNextPos();
	},150)
}

//游戏结束
Game.prototype.pause=function(){
	clearInterval(this.timer);
};
Game.prototype.over=function(){
	clearInterval(this.timer);
	alert('你的得分为：'+this.score);

	//游戏回到最初始的状态
	var snakeWrap=document.getElementById('snakeWrap');
	snakeWrap.innerHTML='';
	snake =new Snake();
	game = new Game();

	var startBtnWrap = document.querySelector('.startBtn');
	startBtnWrap.style.display = 'block';
}

//开启游戏
game = new Game();
var startBtn=document.querySelector('.startBtn button');
startBtn.onclick=function(){
	startBtn.parentNode.style.display="none";
	game.init();
};

//暂停
var snakeWrap=document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button');
snakeWrap.onclick=function(){
	game.pause();
	pauseBtn.parentNode.style.display="block";
}
pauseBtn.onclick=function(){
	game.start();
	pauseBtn.parentNode.style.display="none";

}