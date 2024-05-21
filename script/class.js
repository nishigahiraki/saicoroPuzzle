'use strict';
//
// Dice クラス
class Dice {
	constructor() {
		// サイコロのElement
		this.element = this.createDice();
		//
		// サイコロの位置（ポジション:1~）
		this.posX = 0;
		this.posY = 0;
		//
		// 賽の目情報
		this.surface = { 
				   'Top' : { 'face' : 5, 'rotate' : 0, 'nextFace' : 5},
				'Bottom' : { 'face' : 2, 'rotate' : 0, 'nextFace' : 2},
				  'Left' : { 'face' : 4, 'rotate' : 0, 'nextFace' : 4},
				 'Right' : { 'face' : 3, 'rotate' : 0, 'nextFace' : 3},
					'Up' : { 'face' : 6, 'rotate' : 0, 'nextFace' : 6},
				  'Down' : { 'face' : 1, 'rotate' : 0, 'nextFace' : 1},
		};
		//
		// dice面の初期化
		for(let i=1; i<=6; i++) {
			this.surface['face'+i] = document.createElement('div');
			this.surface['face'+i].className = 'dotWrap';
			let dotsWrap = ''
			for(let j=1; j<=i; j++) {
				dotsWrap += `<span class="dots${i}"></span>`;
			}
			this.surface['face'+i].innerHTML = dotsWrap;
		}
		//表面の更新
		this.updataFace();
		this.crushIs = false;
		//
		// 消し込みの寿命
		this.deleteLife = 320;
		this.diceLifeMAX = 320;
		// 寿命の減少割合
		this.decrementLifeRatio = 1;
		//
		// ダイスの高さ
		this.height = 100;
		// 床上のダイスの高さ
		this.diceHEIGHTonFloor = 100;
		//
		// タイマーの記憶
		this.timerid = 0;
		//
		// 消し込みの記憶
		this.deleteHistory = [];
	}
	createDice() { // サイコロの生成
		const ele = document.createElement('div');
		const diceHTML = `
			<!--div class="dice"-->
				<div class="face Top"></div>
				<div class="face Down"></div>
				<div class="face Bottom"></div>
				<div class="face Right"></div>
				<div class="face Left"></div>
				<div class="face Up"></div>
			<!--/div-->`;
		ele.innerHTML = diceHTML;
		ele.className = 'dice';
		//
		return ele;
	}
	randomSetFace() { // 賽の目をランダムで生成
		//console.log('randomSetFace');
		// 一旦 鏡像体を許す
		const numList = [1,2,3,4,5,6]; // 面候補
		// topの選択
		const topNum = Math.floor(Math.random()*numList.length)+1;
		const bottomNum = 7 - topNum; // bottomは一意
		// 面候補の更新 (選択した数を取り除く)
		numList[topNum-1] = 0; numList[bottomNum-1] = 0;
		numList.sort(); numList.shift(); numList.shift();
		// leftの選択
		const leftNum = numList[ Math.floor(Math.random()*numList.length) ];
		const rightNum = 7 - leftNum; // rightは一意
		for(let i=0; i<numList.length; i++) {
			if( numList[i] === leftNum || numList[i] === rightNum ) { numList[i] = 0; }
		}
		numList.sort(); numList.shift(); numList.shift();
		// upの選択
		const selected = Math.floor(Math.random()*2);
		const upNum = numList[ selected ];
		const downNum = 7 - upNum; // downは一意
		//
		// 賽の目情報の反映
		this.surface['Top']['face'] = this.surface['Top']['nextFace'] = topNum;
		this.surface['Bottom']['face'] = this.surface['Bottom']['nextFace'] = bottomNum;
		this.surface['Left']['face'] = this.surface['Left']['nextFace'] = leftNum;
		this.surface['Right']['face'] = this.surface['Right']['nextFace'] = rightNum;
		this.surface['Up']['face'] = this.surface['Up']['nextFace'] = upNum;
		this.surface['Down']['face'] = this.surface['Down']['nextFace'] = downNum;
		//
		//表面の更新
		this.updataFace();
	}
	setFace(topNum, rightNum, downNum) { // 賽の目の設定
		const bottomNum = 7 - topNum;
		const leftNum = 7 - rightNum;
		const upNum = 7 - downNum;
		//
		// 賽の目情報の反映
		this.surface['Top']['face'] = this.surface['Top']['nextFace'] = topNum;
		this.surface['Bottom']['face'] = this.surface['Bottom']['nextFace'] = bottomNum;
		this.surface['Left']['face'] = this.surface['Left']['nextFace'] = leftNum;
		this.surface['Right']['face'] = this.surface['Right']['nextFace'] = rightNum;
		this.surface['Up']['face'] = this.surface['Up']['nextFace'] = upNum;
		this.surface['Down']['face'] = this.surface['Down']['nextFace'] = downNum;
		//
		//表面の更新
		this.updataFace();
	}
	getTopFace() { // Topの目を取得
		return this.surface['Top']['face'];
	}
	putOnStage( stage ) { // stageに配置
		stage.appendChild(this.element);
	}
	setPos(posX, posY) { // サイコロの表示位置設定
		const dice_ele = this.element;
		this.posX = posX;
		this.posY = posY;
		helperOBJ.setCSS(dice_ele, '--posX', this.posX);
		helperOBJ.setCSS(dice_ele, '--posY', this.posY);
		//console.log(dice_ele, this.posX, this.posY);
	}
	setSurface( target, attr, val) { // 賽の目の設定
		let value = val;
		// 設定要素で場合分け
		if( attr === 'rotate' ) {
			value = val;
			if(value >= 4) { value = 0; }
			if(value <= -1) { value = 3; }
		}
		else if( attr === 'nextFace' ) {
			// 次のfaceをvalに入れて投げているので、ここでは何もしない
		}
		this.surface[target][attr]  = value;
	}
	rotateMove( direction ) { // 転がし
		let changeRotateList = [];
		let changeFaceList = [];
		let rotateDelta = 0;
		switch( direction ) {
			case 'Left' : // 左へ転がすと...
				// 対症療法　(Bottomの向きがになるで)
				const bFace = this.surface['Bottom']['face'];
				const bRotate = this.surface['Bottom']['rotate'];
				this.surface['face'+bFace].style['transform'] = `rotate(${(bRotate + 2)*90}deg)`; // 正確に作れば問題ないハズなので要検討
				//
				// faceの回転がUp,Downに-90
				changeRotateList = ['Up','Down'];
				rotateDelta = -1;
				// 転がした後のfaceの入れ替え
				// left -> bottom, top -> left, right -> top, bottom -> right
				changeFaceList = ['Left','Top','Right','Bottom']; // 入れ替えリスト
			break;
			case 'Right' : // 右へ転がすと...
				// faceの回転がUp,Downに+90
				changeRotateList = ['Up','Down'];
				rotateDelta = 1;
				// 転がした後のfaceの入れ替え
				// right -> bottom -> left -> top -> right
				changeFaceList = ['Right','Top','Left','Bottom']; // 入れ替えリスト
			break;
			case 'Up' : // 上へ転がすと...
				// faceの回転がにleft,right-90
				changeRotateList = ['Left','Right'];
				rotateDelta = 1;
				// 転がした後のfaceの入れ替え
				// Up -> bottom -> Down -> top -> Up
				changeFaceList = ['Up','Top','Down','Bottom']; // 入れ替えリスト
			break;
			case 'Down' : // 下へ転がすと...
				// faceの回転がUp,Downに+90
				changeRotateList = ['Left','Right'];
				rotateDelta = -1;
				// 転がした後のfaceの入れ替え
				// Down -> bottom -> Up -> top -> Down
				changeFaceList = ['Down','Top','Up','Bottom']; // 入れ替えリスト
			break;
		}
		// rotateの設定
		for(let i=0; i<changeRotateList.length; i++) {
			const target = changeRotateList[i];
			this.setSurface(target, 'rotate', this.surface[target]['rotate'] + rotateDelta);
		}
		// nextFaceの設定
		let tmpRotates = [];
		tmpRotates.push(this.surface[changeFaceList[changeFaceList.length-1]]['rotate']);
		for(let i=0; i<changeFaceList.length; i++) {
			const target = changeFaceList[i];
			let face = 0;
			let rotate = 0;
			// faceの引継ぎ
			if(i+1 >= changeFaceList.length) {
				face = this.surface[changeFaceList[0]]['face'];
			}
			else {
				face = this.surface[changeFaceList[i+1]]['face'];
			}
			// 回転の引継ぎ
			tmpRotates.push(this.surface[changeFaceList[i]]['rotate']);
			rotate = tmpRotates.shift();
			//
			this.setSurface(target, 'nextFace', face);
			this.setSurface(target, 'rotate', rotate);
			//console.log(target,rotate);
		}
	}
	updataFace() { // 面の更新
		const targets = ['Top', 'Bottom', 'Left', 'Right', 'Up', 'Down'];
		for(let i=0; i<targets.length; i++) {
			const target = targets[i];
			if(this.surface[target]['nextFace'] == 0) { continue; } // 押しつぶし指定あり
			else if(this.surface[target]['nextFace'] < 0) { this.surface[target]['nextFace'] = Math.abs(this.surface[target]['nextFace']); }
			const face_ele = this.surface['face'+this.surface[target]['nextFace']];
			// nextFaseのfaceを面に張り込む
			const targetSurface = this.element.querySelector('.face.'+target);
			targetSurface.innerHTML = '';
			targetSurface.appendChild(face_ele);
			// 回転の反映
			let rotate = this.surface[target]['rotate'];
			if(target === 'Right') {
				rotate += 1;
			}
			else if(target === 'Left') {
				rotate -= 1;
			}
			else if(target === 'Up') {
				rotate += 2;
			}
			face_ele.style['transform'] = `rotate(${rotate*90}deg)`;
			// faceの更新
			this.surface[target]['face'] = this.surface[target]['nextFace'];
			//
			//console.log(this[target]);
		}
	}
	crushDice() { // diceの圧し潰し
		//console.log('crushDice:::', this.element);
		this.element.style['display'] = 'none';
		this.surface['Top']['face'] = 0; // 床と化す
		this.surface['Top']['nextFace'] = 0; 
		this.crushIs = true;
	}
	deleteDice() { // diceの削除
		//console.log('deleteDice:::', this.element, this.crushIs);
		this.element.parentElement.removeChild(this.element);
	}
	getRatioByDeleteLife() {
		return this.deleteLife / this.diceLifeMAX;
	}
	getDiceHeightByDeleteLife() { // 寿命によるdiceの高さを取得
		const ratio = this.getRatioByDeleteLife();
		this.height = this.diceHEIGHTonFloor * ratio;
		return this.height;
	}
	updataDiceHeightByDeleteLife() { // 寿命に合わせた高さで表示
		//console.log(`${100-100*this.deleteLife/320}px`);
		//const temp = `translate3d(calc((var(--posX) - 1)*100px), ${tempY}, calc((var(--posY) - 1)*100px)) rotateX(0deg) rotateZ(0deg)`;
		const ratio = this.getRatioByDeleteLife();
		this.height = this.diceHEIGHTonFloor * ratio;
		//console.log('ratio:::',ratio);
		const temp = `translateX(calc((var(--posX) - 1)*100px))
					translateY(${this.diceHEIGHTonFloor*(1 - ratio)}px)
					translateZ(calc((var(--posY) - 1)*100px))
					rotateX(0deg) rotateZ(0deg)`;
		helperOBJ.setCSS(this.element, 'transform', temp);
		//
		if( !this.element.classList.contains('DELETE') ) { return; }
		const faceElmnts = this.element.querySelectorAll('.face');
		for( const faceElmt of faceElmnts ) {
			//faceElmt.style['animation-play-state'] = 'paused';
			faceElmt.style['animation-delay'] = `-${10*(1 - ratio)}s`;
			//faceElmt.style['animation-fill-mode'] = 'both';
		}
	}
	downDeleteLife() { // 消し込みでdiceが沈んでいく処理
		if( this.element.classList.contains('PAUSE') ) { return; } // pauseの時は処理しない
		// console.log('deleteLife',this.deleteLife);
		// 寿命を減らす
		//this.deleteLife--;
		this.deleteLife -= this.decrementLifeRatio;
		// 寿命にあった表示位置に更新
		this.updataDiceHeightByDeleteLife();
		//
		// 寿命がつきたら...
		if( this.deleteLife <= 0 ) {
			this.deleteLife = 0;
			return true;
		}
		else {
			return false;
		}
	}
	upDeleteLife() { // 連鎖でdiceの寿命を延ばす処理
		//console.log('upDeleteLife');
		// 寿命を延ばす
		const MAX = 320;
		this.deleteLife += 50;
		if( this.deleteLife >= MAX ) { this.deleteLife = MAX; }
		//
		// 寿命にあった表示位置に更新
		this.updataDiceHeightByDeleteLife();
	}
	addDelete( duration ) { // 未定
	}
	addFlash( duration ) { // diceを光らせる
		//console.log('flash:::', this.element);
		const flg = this.element.classList.contains('DELETE');
		this.element.classList.remove('DELETE');
		this.element.classList.add('FLASH');
		//
		setTimeout(()=>{ // flash後の処理
			this.element.classList.remove('FLASH'); // flash終了
			setTimeout( ()=>{
				if(flg) {
					this.element.classList.add('DELETE-restart');
					setTimeout( ()=>{
						this.element.classList.remove('DELETE-restart');
						this.element.classList.add('DELETE');
					}, 1*FRM);
				}
			}, 1*FRM);
		}, duration);
	}
}
//
// 軌跡を描いてみる
class drawPath {
	constructor( targetElement, posX, posY ,life) {
		this.element = document.createElement('div');
		this.element.className = 'dragPath';
		this.targetElement = targetElement;
		this.posX = posX;
		this.posY = posY;
		this.maxLIFE = this.life = life;
		this.intervalId = 0;
		this.isAutoDelete = false;
		//
		this.element.style['position'] = `absolute`;
		this.element.style['width'] = `${50}px`;
		this.element.style['height'] = `${50}px`;
		this.element.style['border-radius'] = `50%`;
		this.element.style['opacity'] = 1.0;
		this.element.style['background-color'] = `#66f`;
		//this.element.style['transition'] = `all 1s ease-in 0s`;
		//
		drawPath.totalNum++;
		this.nowTotalNum = drawPath.totalNum;
	}
	static totalNum = 0;
	view() { // 表示
		this.targetElement.appendChild(this.element);
		this.element.style['left'] = `${this.posX - this.element.clientWidth/2}px`;
		this.element.style['top'] = `${this.posY - this.element.clientHeight/2}px`;
	}
	start() { // 存在の始まり
		/*
		// 終端設定
		this.element.style['opacity'] = 1.0;
		this.element.style['transform'] = `scale(0.1)`;
		*/
		// totalNumの監視
		this.intervalId = setInterval( this.checkTotal, 1*FRM );
	}
	updata() { // 寿命でサイズ調整
		const ratio = this.life / this.maxLIFE;
		this.element.style['transform'] = `scale(${0.1 + (1.0-0.1)*ratio})`;
	}
	decrementLife( ratio=1 ) { // 寿命を減少
		this.life = Math.max( this.life - ratio, 0 );
	}
	checkTotal = ()=>{
		//console.log(this);
		if( this.nowTotalNum === drawPath.totalNum && !this.isAutoDelete ) { return; }
		this.nowTotalNum= drawPath.totalNum;
		this.decrementLife();
		this.updata();
		if( this.life === 0 ) {
			clearInterval( this.intervalId );
			this.targetElement.removeChild( this.element );
			this.element = null;
		}
	}
}