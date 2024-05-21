'use strict';
//
// 処理のヘルパー
const helperOBJ = {
	setCSS : function( elmt, attr, val ) { // CSSへ設定
		elmt.style.setProperty( attr, val );
	},
	getCSS : function( elmt, attr, flg=false ) { // CSSから取得
		let val = getComputedStyle( elmt ).getPropertyValue( attr );
		if(!flg) {
			val = this.returnNumber( val ); // 単位をとって数値化
		}
		return val;
	},
	returnNumber : function( val ) { // 単位の除去（CSSの単位はpxで読み込まれるっぽい）
		if(val.indexOf('px') != -1) {
			return Number( val.slice(0,-'px'.length) );
		}
		else { return Number( val ); }
	}
};
//
// config群
const configOBJ = {
	// 設定を格納しておく?
	canChangeControlAxis : document.getElementById('checkBoxControlAxis').checked,
}
//
// dice処理群
const diceHelper = {
	canDiceMove : true, // diceの可動フラグ
	players : null, // プレイヤーdiceを格納
	list : [], // 配置diceのリスト
	backupList : [], // diceの配置状態を記録
	deleteLog : [], // 削除ログ [face, addDeletediceNum]
	diceMoveID : 0,
	addNewDiceOnGame : function() { // ゲーム中のdice追加
		if( isPause ) { return; } // pauseの時は処理しない
		//console.log('addNewDiceOnGame:::',autoCreateDiceIs);
		//if( !autoCreateDiceIs ) { return; } // autoCreateDiceIsが falaseなら追加処理をしない
		// stageの空き状況の確認
		stageOBJ.updata(); // stageOBJ.mapの更新
		const emptyPos = stageOBJ.getEmptyPosAtRandom( stageOBJ.map );
		if(!emptyPos) { 
			console.log('ステージが埋め尽くされていました。')
			clearInterval( newDiceINTERVAL_id ); // タイマーをクリア
			return; // 空きマスが無ければ、処理を抜ける
		}
		//
		// Diceを生成
		const tmpDice = new Dice();
		diceHelper.list.push( tmpDice );
		tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
		tmpDice.randomSetFace(); // 表示面をランダムに生成
		if(create2DiceIs) {
			tmpDice.setFace(2, 1, 3); // test設定
		}
		//
		tmpDice.deleteLife = 0; // ライフ0から始める
		tmpDice.element.classList.add('BIRTH'); // 生まれたてのdice
		tmpDice.element.classList.add('first');
		//
		// 配置場所をランダムに選択
		// ステージに配置
		tmpDice.setPos(emptyPos[0], emptyPos[1]);
		setTimeout(function() {tmpDice.element.classList.remove('first');}, 1*FRM);
		stageOBJ.updata(); // stageOBJ.mapの更新
		//
		// diceのせり上がり
		const timerid = tmpDice.timer_id = setInterval(function() {
			if( isPause ) { return; } // pauseで処理をスルーする設定
			tmpDice.deleteLife++;
			if( tmpDice === diceHelper.players ) {
				//console.log('onFocus');
				tmpDice.deleteLife++;
				if( tmpDice.deleteLife >= 320 ) { tmpDice.deleteLife = 320; }
			}
			//
			tmpDice.updataDiceHeightByDeleteLife(); // 高さの更新
			if( tmpDice.deleteLife >= 320 || !tmpDice.element.classList.contains('BIRTH')) {
				//console.log('生まれたよ::::',tmpDice.posX,tmpDice.posY);
				//console.log(tmpDice.element.classList);
				tmpDice.element.classList.remove('BIRTH');
				tmpDice.element.style['transform'] = null;
				//console.log(tmpDice.element.classList);
				clearInterval(timerid);
			}
		},1*FRM);
	},
	getDiceByPosition : function( posX, posY ) { // ステージ上の指定ポジションにあるdiceを取得
		//console.log('getDiceByPosition',posX,posY);
		for(const tmpDice of diceHelper.list) {
			if( tmpDice.posX == posX && tmpDice.posY == posY ) {
				return tmpDice;
			}
		}
		return false;
	},
	checkDeleteDiceByList : function( LIST, targetFACE ) { // 消し込みチェック
		// top face(targetFACE)の数字以上つながっていれば消し込み発動（1の時は別処理）
		let chainIs = false;
		if( LIST.length < targetFACE ) { return; } // 規定数に満たなければ、何もしない
		//
		const deleteDices = []; // 消し込みdiceの一時格納
		const newDeleteDices = []; // 新しく消し込むdiceの一時格納
		// 消し込み中のマークとして、top faceをマイナス値にする
		//console.log('削除発動?:::',LIST);
		for(const temp of LIST) { // 消し込みdiceの設定と抽出
			const tmpDice = this.getDiceByPosition( temp[0], temp[1] );
			//console.log('delete:::',tmpDice);
			if( tmpDice === false ) { // 該当無しだった場合は次のチェックへ(ないはず)
				console.log('continue'); continue;
			}
			deleteDices.push( tmpDice ); // 消し込みdiceの退避
			//
			if( tmpDice.element.classList.contains('DELETE') ) { // リスト内にDELETE付きが含まれていたら連鎖中
				if( targetFACE != 1 ) { // 1の時は連鎖にならない
					chainIs = true;
				}
				// DELETE diceだった場合は次のチェックへ
				tmpDice.addFlash( 4*FRM ); // 消し込み演出で光らせる
				continue;
			}
			if( tmpDice.element.classList.contains('BIRTH') ) { // birthなら、誕生ダイスのclassを削除
				tmpDice.element.classList.remove('BIRTH');
			}
			// 新しく消し込みdiceが見つかってきたら...
			//　delete目印の設定
			tmpDice.surface['Top']['face'] = -1*( targetFACE ); // 消し込みの目印
			this.delete( tmpDice ); // diceの削除処理
			newDeleteDices.push( tmpDice ); // 新しい消し込みdiceの退避
			//
			// 消すdiceの加算 (for debug)
			deleteNumList[ targetFACE - 1 ] += 1;
		}
		//
		// 今回のdelete diceに関する消し込みlogを生成
		const tmpLog = [];
		if( newDeleteDices.length > 0 ) { // 新しい消し込みdiceが1つ以上あれば...
			//console.log('newDeleteDice');
			// 新しい消し込み情報
			const deleteInfo = {
				face : targetFACE,
				addDeleteDiceNum : newDeleteDices.length,
			};
			this.deleteLog.push( deleteInfo ); // deleteLogに追加 => indexがIDになる
			tmpLog.push( this.deleteLog.length-1 );
			//
			//console.log('tmpLog:::',tmpLog);
			// delete diceのdeleteHistoryを統合
			for( const tmpDice of deleteDices ) {
				for( const ID  of tmpDice.deleteHistory ) {
					if( tmpLog.indexOf( ID ) === -1 ) { tmpLog.push( ID ); }
				}
			}
		}
		//console.log('delete log :::', this.deleteLog);
		//console.log('delete history :::', tmpLog);
		//
		// 消し込みdiceのdeleteHistoryを更新
		for( const tmpDice of deleteDices ) {
			//console.log('history add =>');
			tmpDice.deleteHistory = tmpLog;
			//console.log(tmpDice,tmpDice.deleteHistory);
		}
		// 連鎖状態のチェック
		let deleteDiceNum = 0;
		let deleteFace = 0;
		for( const index of tmpLog ) {
			const info = this.deleteLog[index];
			//console.log(index +':::'+ info);
			if(deleteFace != info.face) {
				//console.log('face error:::', deleteFace, info.face);
				deleteFace = info.face;
			}
			deleteDiceNum += info.addDeleteDiceNum;
		}
		//console.log( deleteFace +':::'+ (tmpLog.length-1) + 'chain x' + deleteDiceNum );
		//
		// chain処理
		if( tmpLog.length < 2 ) { // chainなし
			//console.log('chain cut:::', targetFACE);
			chainNumList[ targetFACE - 1 ] = 0; // リストにDELETEが含まれていなければ、リセット
			chainDeleteTotalList[targetFACE-1] = deleteDiceNum;
		}
		else { // chainあり
			chainNumList[ targetFACE - 1 ] = tmpLog.length-1;
			chainDeleteTotalList[targetFACE-1] = deleteDiceNum;
			// 連鎖中のdiceの高さチェック
			for(const tmpPos of LIST) {
				const tmpDice = this.getDiceByPosition( tmpPos[0], tmpPos[1] );
				if(tmpDice != false) {
					tmpDice.upDeleteLife();
				}
			}
			// chain表示
			const chainView = document.body.querySelector('.chainView');
			// animationを付け直すため 一度 クリアにする。
			chainView.classList.remove('out');
			chainView.classList.remove('in');
			chainView.style['transition-duration'] = '0s';
			chainView.style['animation-duration'] = '0s';
			//
			// chain 数の設定
			chainView.textContent = chainNumList[ targetFACE - 1 ] + 'chain x ' + chainDeleteTotalList[targetFACE-1];
			if( maxChainList[ targetFACE - 1 ] < chainNumList[ targetFACE - 1 ] ) {
				maxChainList[ targetFACE - 1 ] = chainNumList[ targetFACE - 1 ]; // maxChainを更新
			}
			// animation の設定
			setTimeout(function() {
				chainView.style['transition-duration'] = null;
				chainView.style['animation-duration'] = null;
				chainView.classList.add('in');
			});
			const chainInDuration = 200;
			setTimeout(function(){ 
				const ratio = 1;
				chainView.classList.add('out');
				chainView.style['animation-duration'] = 10/ratio + 's';
				chainView.classList.remove('in');
			}, chainInDuration);
		}
		// 得点
		scoreOBJ.calcScore( targetFACE, chainDeleteTotalList[ targetFACE - 1 ], chainNumList[ targetFACE - 1 ] );
		//
	},
	deleteDiceAtDiceList : function( targetDice ) { // リストと実体のtargetDiceを削除する
		const index = diceHelper.list.indexOf(targetDice);
		if(index != -1) {
			diceHelper.list.splice(index,1); // リストからtargeDiceを抜く
			targetDice.deleteDice(); // targetDiceの削除処理
		}
		else {
			//console.log('リストに無い');
		}
		//console.log('diceList:::',diceHelper.list);
	},
	backupDices : function( LIST ) { //　dice配置の記録処理　
		this.backupList =[];
		for(let index=0; index<LIST.length; index++) {
			this.backupList.push( {
				'topNum' : LIST[index].surface['Top']['face'],
				'rightNum' : LIST[index].surface['Right']['face'],
				'downNum' : LIST[index].surface['Down']['face'],
				'posX' : LIST[index].posX,
				'posY' : LIST[index].posY,
			} );
		}
	},
	rollActToDice : function( direction ) { // diceにplayerの操作を伝える
		//console.log('move');
		//console.log('サイコロ転がし始め');
		// diceの実際の動き
		const dice = this.players;
		//this.canDiceMove = false;
		//
		const duration = 500; //  transitionの時間(ms)
		dice.element.style['transition-duration'] = `${duration}ms`;
		dice.element.style['transition-delay'] = `${200}ms`;
		dice.element.classList.add(direction); // モーションのクラス設定
		//
		// currentViewの表示
		const currentViewDice_ele = currentViewOBJ.dice.element;
		currentViewDice_ele.style['transition-duration'] = `${duration}ms`;
		currentViewDice_ele.style['transition-delay'] = `${200}ms`;
		currentViewDice_ele.classList.add('notMove'); // モーションのクラス設定
		currentViewDice_ele.classList.add(direction); // モーションのクラス設定
		//
		clearTimeout( this.diceMoveID );
		this.diceMoveID = setTimeout(()=>{
			//console.log('サイコロ転がし終わり');
			// 後始末
			dice.element.style['transition-duration'] = '0s'; // 単純な入れ替え用にdurationを0に
			dice.element.style['transition-delay'] = `${0}ms`;
			dice.setPos(dice.posX, dice.posY);
			dice.element.classList.remove(direction);
			dice.updataFace(); // Dice面の更新
			//this.canDiceMove = true;
			setTimeout( ()=>{ this.canDiceMove = true; }, 1*FRM ); // 直置きでは、移動処理と後始末がかち合う可能性があった
			// 移動後Mapの更新
			stageOBJ.updata(); // <--不要検討
			//
			// currentViewの表示
			currentViewDice_ele.style['transition-duration'] = `0s`;
			currentViewDice_ele.style['transition-delay'] = `${0}ms`;
			currentViewDice_ele.classList.remove(direction); // モーションのクラス設定
			//
			currentViewOBJ.updata(this.players); // 現在のdice状態表示の更新
			//
				// 消し込みチェック
				const targetFACE = dice.getTopFace();
				//console.log('diceHelper.players:::',dice.posX,dice.posY);
				diceHelper.checkDeleteDiceByList( stageOBJ.buildLinkDiceList( dice ) , targetFACE );
				// ステージMapの更新
				stageOBJ.updata(); // <--不要検討
			//
		}, duration);
		//
	},
	roll : function( POS, direction ) { // diceの転がし処理
		//console.log('roll');
		// diceの転がし処理
		this.canDiceMove = false;
		// Diceに移動先位置の反映
		this.players.posX = POS[0];
		this.players.posY = POS[1];
		// faceの回転設定
		this.players.rotateMove( direction );
		//　playerFocus位置の更新
		focusOBJ.translate( POS[0], POS[1] ); // focus移動処理
		// 実際のdice操作
		this.rollActToDice( direction );
	},
	delete : function( DICE ) { // diceの削除処理
		//　消し込み対象を光らせる処理
		const flashDuration = 4*FRM;
		DICE.addFlash( flashDuration ); // 消し込み演出で光らせる
		//console.log('deleteProc:::', DICE);
		clearInterval( DICE.timerid );
		setTimeout(()=>{
			DICE.element.classList.add('DELETE');
			//tmpDice.element.style['transition-duration'] = null; // 移動時につけた duration設定が邪魔
			DICE.element.style['transition'] = 'none'; // 複数連結時のズレ防止
			DICE.timerid = setInterval(()=>{
				if( DICE.downDeleteLife() ) { // downDeleteLife:diceの寿命が尽きたら、trueを返す。
					console.log('delete');
					// 後始末
					clearInterval( DICE.timerid ); // タイマーのクリア
					this.deleteDiceAtDiceList(DICE); // diceの削除
					DICE.element.classList.remove('DELETE');
					stageOBJ.updata();
				}
			}, 1*FRM);
		}, flashDuration+1*FRM );
	},
};
//
// stage処理群
const stageOBJ = {
	maxSizeX : 4, // ステージサイズ X
	maxSizeY : 4, // ステージサイズ Y
	map : [ // ステージの配列
		[ 0, 0, 0, 0 ],
		[ 0, 0, 0, 0 ],
		[ 0, 0, 0, 0 ],
		[ 0, 0, 0, 0 ],
	],
	checkedMap : [],
	linkDiceList : [],
	updata : function() { // ステージ上の配置状況の更新
		// ステージMapのリセット
		this.map[0] = [0,0,0,0];
		this.map[1] = [0,0,0,0];
		this.map[2] = [0,0,0,0];
		this.map[3] = [0,0,0,0];
		//console.log(diceHelper.list);
		for(let i=0; i<diceHelper.list.length; i++) {
			if( diceHelper.list[i].posX < 1 && diceHelper.list[i].posY < 1 ) { continue; }
			const _X = diceHelper.list[i].posX-1;
			const _Y = diceHelper.list[i].posY-1;
			const tmpFace = diceHelper.list[i].getTopFace();
			// diceの圧し潰し時につけた0(床)のフラグで
			// playerDiceが上書きされてしまう可能性があったので...
			if( tmpFace != 0 ) {
				this.map[_Y][_X] = tmpFace;
			}
		}
		//
		// delete diceの有無をチェック
		if( !this.checkExistDeleteDice() ) { // Map上にdelete diceがなければ...
			diceHelper.deleteLog = []; // deleteLogを空に
		}
	},
	reset : function() { // ステージのリセット　// 旧resetStage
		// リセット
		// diceのリセット
		for( const dice of diceHelper.list) {
			dice.deleteDice();
		}
		diceHelper.list.length = 0;
		//
		// 得点のリセット
		chainNumList = [0,0,0,0,0,0];
		deleteNumList = [0,0,0,0,0,0];
		/*
		const target = document.body.querySelector('.diceWrap');
		while( target.children.length > 0 ) {
			target.removeChild(target.lastChild);
		}
		*/
	},
	getEmptyPosAtRandom : function() { // MAP上の空白の場所をランダムで返す
		// 全マスチェック法
		// MAP上の候補地をあげる
		const emptyPosList = this.buildEmptyPosList();
		//
		if( emptyPosList.length === 0 ) {
			// 候補地がなかった場合...
			return false;
		}
		else {
			// 候補地があれば、ランダムで選択
			return emptyPosList[ Math.floor(emptyPosList.length*Math.random()) ];
		}
	},
	buildEmptyPosList : function() { // MAPの空白の場所をlistで返す
		// 全マスチェック法
		// MAP上の候補地をあげる
		const emptyPosList = [];
		for(let y=0; y<this.map.length; y++) {
			for(let x=0; x<this.map[y].length; x++) {
				if( this.map[y][x] === 0 ) {
					emptyPosList.push([x+1,y+1]);
				}
			}	
		}
		return emptyPosList;
	},
	buildDeleteDiceList : function() { // mapをチェックして、DELETE状態のdiceをリスト化
	// 全マスチェック法
		// MAP上の候補地をあげる
		const deletePosList = [];
		for(let y=0; y<this.map.length; y++) {
			for(let x=0; x<this.map[y].length; x++) {
				if( this.map[y][x] < 0 ) {
					deletePosList.push([x+1,y+1]);
				}
			}	
		}
		return deletePosList;
	},
	buildLinkDiceList : function( DICE ) { // mapをチェックして、消し込み候補のdiceをリスト化
		//console.log('buidLinkDiceList:::',DICE.getTopFace());
		// 新規チェックになるので、playersDiceを起点に確認 => 汎用性を持たせて引数にdiceを指定
		const linkDiceList = []; // 起点からのつながっているDiceのリスト <- あとで数をチェックする
		const checkedMap = [
			[false, false, false, false],
			[false, false, false, false],
			[false, false, false, false],
			[false, false, false, false],
			]; // チェック済みのMap
		const targetFACE = DICE.getTopFace(); // 起点の top face
		if( targetFACE === 0 ) { return []; } // 床の時は、処理なし
		else if( targetFACE === 1 ) { // top faceが1の時の処理
			// 上下左右で消し込み中のdiceに接していれば...
			const targetX = DICE.posX -1; // posをindexに
			const targetY = DICE.posY -1;
			//
			let flg = false;
			if( targetY-1 >= 0 && stageOBJ.map[targetY-1][targetX] < 0 ) { flg = true; }
			if( targetY+1 < stageOBJ.map.length && stageOBJ.map[targetY+1][targetX] < 0 ) { flg = true; }
			if( targetX-1 >= 0 &&  stageOBJ.map[targetY][targetX-1] < 0 ) { flg = true; }
			if( targetX+1 < stageOBJ.map[1].length && stageOBJ.map[targetY][targetX+1] < 0 ) { flg = true; }
			//
			// 押し込みのdiceが1の場合はリストに加える
			if( flg && DICE != diceHelper.players ) {
				console.log('push Dice');
				linkDiceList.push([DICE.posX, DICE.posY]);
			}
			//
			// 起点以外でtop faceが1のdice全部
			if(flg) {
				for(let _Y=0; _Y<stageOBJ.map.length; _Y++) {
					for(let _X=0; _X<stageOBJ.map[_Y].length; _X++) {
						if( 1 === Math.abs(stageOBJ.map[_Y][_X]) && 
							(_X != DICE.posX-1 || _Y != DICE.posY-1 )) {
							linkDiceList.push([_X+1,_Y+1]);
						}
					}
				}
			}
		}
		else { // 1以外の処理
			makeLinkDiceList( targetFACE, DICE.posX-1, DICE.posY-1 ); // linkDiceListの生成
		}
		//console.log(`linkDiceList at ${targetFACE}::::${linkDiceList}`);
		// console.log('targetFACE:::',targetFACE);
		// // for(let i=0;i<4;i++) {
		// // 	console.log(checkedMap[i]);
		// // }
		// console.log('================');
		// for(let i=0;i<4;i++) {
		// 	console.log(stageOBJ.map[i]);
		// }
		// console.log('================');
		// console.log(targetFACE,':::',linkDiceList);
		return linkDiceList;
		//
		// linkDiceListを回帰処理で生成
		function makeLinkDiceList(topface, _X, _Y) {
			//console.log('makeLinkDiceList:::',_X,_Y);
			// チェック済みにマーク
			checkedMap[_Y][_X] = true;
			// 消し込み対象になるかチェック
			// 消し込み中のマークとして、top faceをマイナス値にしているので、絶対値で検査
			if( topface === Math.abs(stageOBJ.map[_Y][_X]) ) {
				// 天面の数字があっているのでリストに追加
				linkDiceList.push([_X+1,_Y+1]);
			}
			else {
				// 繋がりが切れているので、チェックを抜ける
				return;
			}
			// 
			// 上下左右にチェックをだす。
			// 上 : stageOBJ.map[_Y-1][_X]
			if( _Y-1 >= 0 ) {
				if( checkedMap[_Y-1][_X] !== true ) {
					makeLinkDiceList(topface, _X, _Y-1);
				}
			}
			// 下 : stageOBJ.map[_Y+1][_X]
			if( _Y+1 < stageOBJ.maxSizeY) {
				if(checkedMap[_Y+1][_X] !== true ) {
					makeLinkDiceList(topface, _X, _Y+1);
				}
			}
			// 左 : stageOBJ.map[_Y][_X-1]
			if( _X-1 >= 0 ) {
				if( checkedMap[_Y][_X-1] !== true ) {
					makeLinkDiceList(topface, _X-1, _Y);
				}
			}
			// 右 : stageOBJ.map[_Y][_X+1]
			if( _X+1 < stageOBJ.maxSizeX ) {
				if( checkedMap[_Y][_X+1] !== true ) {
					makeLinkDiceList(topface, _X+1, _Y);
				}
			}
		}
		//
	},
	checkExistDeleteDice : function() { // MAP内のdelete diceの有無を返す
		const list = this.buildDeleteDiceList();
		//console.log(list.length);
		return (list.length>0) ? true : false;
	},
};
//
// focus処理群
const focusOBJ = {
	elemt : document.body.querySelector('.playerFocus'),
	shadow : document.body.querySelector('.playerShadow'),
	mark : document.body.querySelector('.playerMark'),
	posX : 0,
	posY : 0,
	currentDir : 135,
	requestDir : '', // 操作要求
	canRequest : true,
	heightIsValiable : true, // 高さが可変か否か
	height : 100, // 100が通常dice上,0が床
	timerid : 0, // timer ID
	setPos : function( posX, posY ) {
		this.posX = posX;
		this.posY = posY;
		helperOBJ.setCSS(focusOBJ.elemt, '--posX', posX);
		helperOBJ.setCSS(focusOBJ.elemt, '--posY', posY);
		// shadow
		helperOBJ.setCSS(focusOBJ.shadow, '--posX', posX);
		helperOBJ.setCSS(focusOBJ.shadow, '--posY', posY);
		// mark
		helperOBJ.setCSS(focusOBJ.mark, '--posX', posX);
		helperOBJ.setCSS(focusOBJ.mark, '--posY', posY);
	},
	setDir : function( angle ) {
		helperOBJ.setCSS(focusOBJ.elemt, '--rotate', angle + 45); // 先端の向きを吸収している
		this.currentDir = angle; // 現在の向きとして待避
		//shadow
		helperOBJ.setCSS(focusOBJ.shadow, '--rotate', angle + 45);
	},
	turnJudge : function( direction ) {
		if(this.elemt.classList.contains('ROTATE') ) { return false; }
		const angleList = ['Up','Right','Down','Left'];
		const goalAngleNum = angleList.indexOf(direction);
		const currentAngleNum = this.currentDir%360 / 90; //currentDirは正とする
		const turn = goalAngleNum - currentAngleNum;
		//console.log(`入力時::${this.currentDir}、目標::${goalAngleNum*90}`);
		//console.log(`入力時差分::${turn}`);
		// turn < 0 左回り、 turn > 0　右回り
		// turn = 0 or 4 回転なし or 一回転 4以上は出ないはず
		if( turn == 0 ) { return false; } // 回転しない
		else if( Math.abs(turn) <= 2 ) { return 90*turn; }
		else  if( Math.abs(turn) >= 3 ) {
			if(currentAngleNum == 0 && goalAngleNum == 3) { return -90; }
			else if(currentAngleNum == 3 && goalAngleNum == 0) { return 90; }
			else {
				console.log('範囲外：：', currentAngleNum, goalAngleNum);
				return turn > 0 ? 90 : -90;
			}
		}
	},
	rotate : function( angle ) { // playerFocusの回転
		//console.log(`回転開始::${this.currentDir}`);
		//const thisElement = this.elemt;
		this.canRequest = false;
		const duration = 200;//8*FRM;
		this.elemt.classList.add('ROTATE');
		this.shadow.classList.add('ROTATE');
		this.elemt.style['transition-duration'] = `${duration}ms`;
		this.shadow.style['transition-duration'] = `${duration}ms`;
		//focusOBJ.setDir( focusOBJ.currentDir + delta );
		//const tmpAngle = this.currentDir + angle;
		this.setDir( angle );
		//
		setTimeout( ()=> {
			this.elemt.classList.remove('ROTATE');
			this.shadow.classList.remove('ROTATE');
			this.elemt.style['transition-duration'] = null;
			this.shadow.style['transition-duration'] = null;
			// 数値の矯正
			//console.log( helperOBJ.getCSS(focusOBJ.elemt, 'transform') );
			if(angle < 0) {
				this.setDir( angle%360 + 360 );
			}
			else {
				this.setDir( angle%360 );
			}
			//console.log(`回転終了::${this.currentDir}`);
			this.canRequest = true;
		}, duration);
	},
	translate : function( posX, posY ) { // playerFocus位置の移動処理
		//console.log('tranlate in');
		//const thisElement = this.elemt;
		this.canRequest = false;
		const duration = 400;//10*FRM;
		this.elemt.classList.add('TRANSLATE');
		this.shadow.classList.add('TRANSLATE');
		this.mark.classList.add('TRANSLATE');
		this.elemt.style['transition-duration'] = `${duration}ms`;
		this.shadow.style['transition-duration'] = `${duration}ms`;
		this.mark.style['transition-duration'] = `${duration}ms`;

		this.setPos( posX, posY );
		clearTimeout(this.timerid);
		this.timerid = setTimeout( ()=> {
			this.elemt.classList.remove('TRANSLATE');
			this.shadow.classList.remove('TRANSLATE');
			this.mark.classList.remove('TRANSLATE');
			this.elemt.style['transition-duration'] = null;
			this.shadow.style['transition-duration'] = null;
			this.mark.style['transition-duration'] = null;
			//console.log('tranlate out');
			this.canRequest = true;
		},duration);
	},
	updataFocusHeight : function( height ) {
		if(height != null) {
			this.height = height; // 高さの引継ぎ
		}
		const temp = `translateY(${(100-this.height)-10}px) rotateX(90deg)`;
		const tempShadow = `translateY(${(100-this.height)-2}px) rotateX(90deg)`;
		const tempMark = `translateY(${(100-this.height)/1.5-70}px) rotateX(90deg)`;
		//console.log('diceLife on focus:::', temp);
		//console.log(this.elemt.parentElement);
		helperOBJ.setCSS(this.elemt.parentElement, 'transform', temp);
		helperOBJ.setCSS(this.shadow.parentElement, 'transform', tempShadow);
		helperOBJ.setCSS(this.mark.parentElement, 'transform', tempMark);
	},
	footCheck : function() {
		//console.log('foot check');
		// 足元のチェック
		const footDice = diceHelper.getDiceByPosition(this.posX, this.posY);
		//console.log('focusOBJ:::',focusOBJ.posX,focusOBJ.posY);
		//const footDice = diceHelper.getDiceByPosition(focusOBJ.posX,focusOBJ.posY);
		if( !diceHelper.canDiceMove ) { return; } // 可動状態になければ、何もしない
		if( footDice ) { // focusとdiceが重なっていたら...
			diceHelper.players = footDice;
			currentViewOBJ.updata(diceHelper.players); // 表示の更新
		}
		else {
			diceHelper.players = floorDice;
		}
		//console.log('dice height:::', diceHelper.players.getDiceHeightByDeleteLife() );
		// focusの高さをdiceHelper.players の高さに合わせる
		if( this.heightIsValiable ) { // focusの高さが可変になっていれば...
			const height = diceHelper.players.getDiceHeightByDeleteLife();
			this.updataFocusHeight( height );
			if( focusOBJ.height <= 0) {
				floorDice.setPos(this.posX, this.posY);
				currentViewOBJ.updata(floorDice); // 現在のdice状態表示の更新
			}
		}
	}
}
//
// control処理群
const controlOBJ = {
	dropDirection : '', // 飛び降り方向
	dropTimerIDs : [], // 飛び降りタイマー格納庫
	isKeyup : true, // keyupの監視用
	checkKeyupIntervalID : 0,
	behaviorJudge : function ( currentPOS, nextPOS, overPOS, direction) { // diceの挙動判断
		if( !diceHelper.canDiceMove ) { console.log('dice not move'); return; }
		// POSの引き継ぎ
		const currentX = currentPOS[0];
		const currentY = currentPOS[1];
		const nextX = nextPOS[0];
		const nextY = nextPOS[1];
		const overX = overPOS[0];
		const overY = overPOS[1];
		// dice化
		const currentDice = diceHelper.getDiceByPosition( currentX, currentY );
		const nextDice = diceHelper.getDiceByPosition( nextX, nextY );
		// 高低差出し
		const currentHeight = ( currentDice != false ) ? currentDice.height : 0;
		const nextHeight = ( nextDice != false ) ? nextDice.height : 0;
		const differenceHeight = Math.abs(nextHeight) - Math.abs(currentHeight);
		//
		if( currentPOS.toString() === nextPOS.toString() ) { // 移動なし
			//console.log('not move');
			return false;
		}
		else if( stageOBJ.map[currentY-1][currentX-1] === 0 ) { // 今がゆか
			this.cunrentOnFloor( nextPOS, overPOS, differenceHeight);
		}
		else if( stageOBJ.map[currentY-1][currentX-1] < 0 ) { // 今がDELETE
			// currentDice.element.classList.contains('DELETE')
			this.currentOnDeleteDice( nextPOS, overPOS, differenceHeight );
		}
		else if( currentDice.element.classList.contains('BIRTH') ) { // 今がBIRTH
			this.currentOnBirthDice( nextPOS, differenceHeight );
		}
		else { // 今が通常dice
			this.currentOnNormalDice( currentPOS, nextPOS, direction, nextHeight );
		}
	},
	currentOnBirthDice : function( nextPOS, differenceHEIGHT ) { // 今がBIRTH dice
		//console.log('now on BIRTH');
		// 移動先の状態で場合わけ
		const nextX = nextPOS[0];
		const nextY = nextPOS[1];
		const nextDice = diceHelper.getDiceByPosition( nextX, nextY );
		// BIRTH diceは転がらない
		if( stageOBJ.map[nextY-1][nextX-1] === 0 ) { // ゆか
			return false; // => 移動不可
		}
		else if( stageOBJ.map[nextY-1][nextX-1] < 0 ) { // DELETE dice
			//nextDice.element.classList.contains('DELETE')
			return false; // => 移動不可
		}
		else if( nextDice.element.classList.contains('BIRTH') ) { // BIRTH dice
			// => 無条件移動
			focusOBJ.translate( nextX, nextY );
			if(differenceHEIGHT < 0) {
				focusOBJ.heightIsValiable = false;
				// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
				setTimeout( function() {
					focusOBJ.heightIsValiable = true;
				}, 6*FRM);
			}
		}
		else if( nextDice !== false ) { // 通常 dice
			// => 無条件移動
			focusOBJ.translate( nextX, nextY );
		}
	},
	currentOnDeleteDice : function( nextPOS, overPOS, differenceHEIGHT ) { // 今がDELETE dice
		//console.log('now on DELETE');
		// 移動先の状態で場合わけ
		const nextX = nextPOS[0];
		const nextY = nextPOS[1];
		const overX = overPOS[0];
		const overY = overPOS[1];
		const nextDice = diceHelper.getDiceByPosition( nextX, nextY );
		const riseLimitHEIGHT = 60;
		const dropLimitHEIGHT = 70;
		//
		const nowDirection = focusOBJ.requestDir;
		//console.log( 'check::::', this.dropDirection, nowDirection );
		if( this.dropDirection !== nowDirection ) {
			timerClearFunc();
			this.dropDirection = nowDirection;
		}
		//
		// DELETE diceは転がらない
		if( stageOBJ.map[nextY-1][nextX-1] === 0 ) { // ゆか
			if( Math.abs(differenceHEIGHT) <= dropLimitHEIGHT ) {
				// => 下り : 特定の高さ以下なら移動
				timerClearFunc();
				focusOBJ.translate( nextX, nextY );
				focusOBJ.heightIsValiable = false;
				// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
				setTimeout( function() {
					focusOBJ.heightIsValiable = true;
				}, 6*FRM);
				//console.log('downFloor');
			}
			else {
				// => 特定の高さを超えると、飛び降り準備
				// 押し続けると飛び降りれる様にする
				const DurationOfDropJudge = 1000;
				//
				if( this.dropTimerIDs.length > 0 ) {
					//console.log('drop cut:::length:',this.dropTimerIDs.length);
					//console.log('not setTimer check');
					return;
				}
				//
				let isNotDrop = true;
				//
				const judgeID = setTimeout(()=>{ 
					console.log('drop:::', differenceHEIGHT,'/',dropLimitHEIGHT);
					focusOBJ.translate( nextX, nextY );
					focusOBJ.heightIsValiable = false;
					timerClearFunc();
					isNotDrop = false;
					//
					// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
					setTimeout( ()=>{
						focusOBJ.heightIsValiable = true;
					}, 6*FRM);
				}, DurationOfDropJudge);
				this.dropTimerIDs.push( judgeID );
				//console.log('setTimeout:::', judgeID);
				//
				// アップイベントの監視方法を検討 (upが入ったかどうかをintervalで監視?)
				const keyupChecker = ()=>{
					//console.log('keyupChecker:::',this.isKeyup);
					if( this.isKeyup ) {
						timerClearFunc();
					}
					else{
						if( isNotDrop ) { setTimeout( keyupChecker, 1*FRM); }
					}
				};
				keyupChecker();
				//
			}
		}
		else if( stageOBJ.map[nextY-1][nextX-1] < 0 ) { // DELETE dice
			// nextDice.element.classList.contains('DELETE')
			// => 無条件移動
			focusOBJ.translate( nextX, nextY );
			//
			if(differenceHEIGHT < 0) {
				focusOBJ.heightIsValiable = false;
				// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
				setTimeout( function() {
					focusOBJ.heightIsValiable = true;
				}, 6*FRM);
			}
		}
		else if( nextDice.element.classList.contains('BIRTH') ) { // BIRTH dice
			// => 無条件移動
			focusOBJ.translate( nextX, nextY );
			//
			if(differenceHEIGHT < 0) {
				focusOBJ.heightIsValiable = false;
				// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
				setTimeout( function() {
					focusOBJ.heightIsValiable = true;
				}, 6*FRM);
			}
		}
		else if( nextDice !== false ) { // 通常 dice
			if( Math.abs(differenceHEIGHT) <= riseLimitHEIGHT ) {
				// => 上り : 特定の高さなら移動
				focusOBJ.translate( nextX, nextY );
			}
			else {
				// => 特定の高さを超えると、押し出しの可能性
				if( stageOBJ.map[overY-1][overX-1] === 0 ) {
					// => 押し出しの可能性 : ひとつ先が空なら押し出し
					// 押し込み処理
					this.pushDice( nextX, nextY, nextDice, overX, overY,);
				}
				else {
					// => 移動不可 => ひとつ先が詰まっている
					return false;
				}
			}
		}
		function timerClearFunc( evt ) {
			//console.log('timerClearFunc');
			controlOBJ.dropDirection = '';
			AllTimerClearByIDs( controlOBJ.dropTimerIDs );
		}
		function AllTimerClearByIDs( IDs ) { // たまったタイマーのクリア
			//console.log('AllTimerClearByIDs:::', IDs.length);
			while( IDs.length > 0 ) {
				const ID = IDs.shift();
				//console.log('clearID:::', ID);
				clearTimeout( ID );
			}
		}
	},
	currentOnNormalDice : function( currentPOS, nextPOS, direction, nextHEIGHT ) { // 今が通常 dice
		//console.log('now on DICE');
		// 移動先の状態で場合わけ
		const currentX = currentPOS[0];
		const currentY = currentPOS[1];
		const nextX = nextPOS[0];
		const nextY = nextPOS[1];
		const nextDice = diceHelper.getDiceByPosition( nextX, nextY );
		const pressLimitHEIGHT = 75;
		const changeLimitHEIGHT = 40;
		//
		if( stageOBJ.map[nextY-1][nextX-1] === 0 ) { // ゆか
			// => 無条件転がり
			diceHelper.roll( nextPOS, direction ); // diceの転がし処理
		}
		else if( stageOBJ.map[nextY-1][nextX-1] < 0 ) { // DELETE dice
			//nextDice.element.classList.contains('DELETE')
			if( nextHEIGHT <= pressLimitHEIGHT ) {
				// => 転がり : 特定の高さ以下なら圧し潰し
				// diceの圧し潰し処理
				const nextDice = diceHelper.getDiceByPosition( nextX, nextY );
				if( nextDice ){
					nextDice.crushDice(); // 次のDELETE diceを床にする
					diceHelper.deleteDiceAtDiceList(nextDice); // リストからdiceの削除
				}
				//
				diceHelper.roll( nextPOS, direction ); // diceの転がし処理
			}
			else {
				// => 特定の高さを超えると、移動不可
				return false;
			}
		}
		else if( nextDice.element.classList.contains('BIRTH') ) { // BIRTH dice
			if( nextHEIGHT <= changeLimitHEIGHT ) {
				// => 転がり : 特定の高さ以下なら入れ替え
				// nextDiceの位置を替える
				nextDice.element.style['transition-duration'] = '0s';
				setTimeout(function() {
					nextDice.setPos(currentX, currentY);
				}, 300);
				setTimeout(function() {
					nextDice.element.style['transition-duration'] = null;
				}, 300+1*FRM);
				//
				diceHelper.roll( nextPOS, direction ); // diceの転がし処理
			}
			else {
				// => 特定の高さを超えると、移動
				focusOBJ.translate( nextX, nextY );
				focusOBJ.heightIsValiable = false;
				// 飛び降り時の高さの変更タイミングを遅らせる　<- 即時高さの調整をするとdiceに埋まるので
				setTimeout( function() {
					focusOBJ.heightIsValiable = true;
				}, 6*FRM);
			}
		}
		else if( nextDice !== false ) { // 通常 dice
			// => 無条件移動
			focusOBJ.translate( nextX, nextY );
		}
	},
	cunrentOnFloor : function( nextPOS, overPOS, differenceHEIGHT ) { // 今がゆか
		//console.log('now on Floor');
		// 移動先の状態で場合わけ
		const nextX = nextPOS[0];
		const nextY = nextPOS[1];
		const overX = overPOS[0];
		const overY = overPOS[1];
		const nextDice = diceHelper.getDiceByPosition( nextX, nextY );
		const riseLimitHEIGHT = 50;
		//
		if( stageOBJ.map[nextY-1][nextX-1] === 0 ) { // ゆか
			// => 無条件移動
			focusOBJ.translate( nextX, nextY );
		}
		else if( stageOBJ.map[nextY-1][nextX-1] < 0 ) { // DELETE dice
			//nextDice.element.classList.contains('DELETE')
			//console.log(differenceHEIGHT);
			if( Math.abs(differenceHEIGHT) <= riseLimitHEIGHT ) {
				// => 特定の高さ以下なら 上り
				focusOBJ.translate( nextX, nextY );
			}
			else {
				// => 特定の高さを超えると、移動不可
				return false;
			}
		}
		else if( nextDice.element.classList.contains('BIRTH') ) { // BIRTH dice
			if( Math.abs(differenceHEIGHT) <= riseLimitHEIGHT ) {
				// => 特定の高さ以下なら 上り
				focusOBJ.translate( nextX, nextY );
			}
			else {
				// => 特定の高さを超えると、移動不可
				return false;
			}
		}
		else if( nextDice !== false ) { // 通常 dice
			if( stageOBJ.map[overY-1][overX-1] === 0 ) {
				// => 押し出しの可能性 : ひとつ先が空なら押し出し
				// 押し込み処理
				this.pushDice( nextX, nextY, nextDice, overX, overY,);
			}
			else {
				// => 移動不可 => ひとつ先が詰まっている
				return false;
			}
		}
	},
	pushDice : function( nextX, nextY, nextDice, overX, overY,) {
		//　playerFocus位置の更新
		focusOBJ.translate( nextX, nextY ); // playerFocus位置の移動処理
		//focusOBJ.updataFocusHeight(0); // playerFocusの高さ更新
		// 実際のdice操作
		nextDice.element.style['transition-duration'] = null; // 動かす前にdurationの整理
		nextDice.setPos( overX, overY ); // 押し込んだdiceの移動
		//
		diceHelper.players = floorDice; // 床に設定
		diceHelper.players.posX = nextX;
		diceHelper.players.posY = nextY;
		//
		setTimeout( ()=>{
			// 後始末
			// 移動後Mapの更新
			stageOBJ.updata();
			// 消し込みチェック
			const targetFACE = nextDice.getTopFace();
			diceHelper.checkDeleteDiceByList( stageOBJ.buildLinkDiceList( nextDice ) , targetFACE );
			stageOBJ.updata(); // ステージMapの更新
		}, 300);
	},
};
// gameの選択処理群
const gameSelectorOBJ = {
	pos : 0,
	list : [],
	caseLength : 5,
	canControl : true, // 抑制検討中
	init : function( LIST, firstPOS ) {
		gameSelectorOBJ.pos = firstPOS;
		gameSelectorOBJ.list = LIST;
		gameSelectorOBJ.caseLength = LIST.length;
		//console.log(this.caseLength);
		//console.log(this.pos, this.list);
		//
		//this.focusClear();
		//
		//if( !document.body.querySelector('.gameoverView').classList.contains('open') ) { return; }
		//const menuBTNs = document.body.querySelectorAll('#menuWrap>div');
		document.getElementById('menuWrap').classList.remove('on');
		const menuBTNs = document.getElementById('menuWrap').getElementsByTagName('div');
		for( const BTN of menuBTNs ) {
			BTN.style['display'] = 'none';
		}
		//const BTNs = [];
		for( const btnID of this.list ) {
			//const BTN = document.body.querySelector('#' + btnID);
			const BTN = document.getElementById(btnID);
			BTN.parentElement.style['display'] = null;
			//BTNs.push( BTN );
		}
		setTimeout( ()=>{
			document.getElementById('menuWrap').classList.add('on');
			this.focusClear();
		}, 1*FRM);
		//
		//console.log(BTNs);
		//document.body.querySelector('#menuWrap').replaceChildren();
		//document.body.querySelector('#menuWrap').replaceChildren(...allMenuBTNs, ...BTNs);
	},
	focusClear : function() { // 選択のclear
		//console.log('focusClear:::', this.list);
		for(let i=0; i<this.caseLength; i++) {
			document.body.querySelector('#' + this.list[i]).classList.remove('focus');
		}
	},
	updata : function( KEY ) {
		if( document.body.querySelector('.gameSelectView').classList.contains('open') ) { 
			//this.list = gameModeLIST;
			//this.caseLength = this.list.length;
		}
		else if( document.body.querySelector('.gameoverView').classList.contains('open') ) {
			//this.list = gameoverSelectLIST;
			//this.caseLength = this.list.length;
		}
		else { return; }
		const controlSet = () => {
			this.canControl = false;
			const controlDelay = 200;
			setTimeout(() => { this.canControl = true; }, controlDelay);
		}
		//
		switch( KEY ) {
			case 'ArrowUp' : // 選択肢の移動
				if(!this.canControl) {return;}
				this.pos--;
				controlSet();
			break;
			case 'ArrowDown' : // 選択肢の移動
				if(!this.canControl) {return;}
				this.pos++;
				controlSet();
			break;
			case 'Shift' : // 選択肢の決定
			// console.log('checked:::', this.pos);
				// 選択中の内容を決定
				try {
					//console.log('decideSelector:::',this.pos)
					const BTN = document.body.querySelector('#' + this.list[this.pos]);
					//console.log(BTN);
					if( BTN === undefined || BTN === null ) { return; }
					if( BTN.disabled ) { break; } // disabledならスルー
					if( !BTN.classList.contains('focus') ) { return; } // focusが付いていなければスルー
					BTN.dispatchEvent(new Event('click'));
					BTN.classList.toggle('focus');
					BTN.focus();
				}
				catch(error) {
					console.log('push Shift error:::',error);
				}
			break;
			default : return;
		}
		// フォーカスposの矯正
		this.pos = this.pos%this.caseLength;
		if( this.pos < 0 ) { this.pos = this.caseLength + this.pos; }
		//console.log('updataSelector:::', gameModeLIST[this.pos]);
		//
		// フォーカス表示の移動
		for(let i=0; i<this.caseLength; i++) {
			//console.log(this.list[i]);
			document.body.querySelector('#' + this.list[i]).classList.remove('focus');
		}
			document.body.querySelector('#' + this.list[this.pos]).classList.add('focus');
		//

		//console.log('pos::::',this.pos);
	},
};
// drag control処理
const dragControlOBJ = {
	clickFlg : false,
	delta : 0,
	controlTimerIDs : [], // チェック用
	clickJudgeTimerID : 0, // クリック判定用
	rippleTimerID : 0, // 終了処理用
	dragPaths : [], // dragPathの格納庫
	originUpdataTimerID : 0, // 原点更新用
	originUpdataCount : 0,
	originUpdataTimeBorder : 10,
	originUpdataLengthBorder : 15,
	originUpdataPos : [],
	init : function( controlWrap, controlPoint ) { // リスナーの設定
		//console.log(this);
		this.controlWrap = controlWrap;
		this.controlPoint = controlPoint;
		this.addDragStartListeners();
		//
	},
	addDragStartListeners : function() {
		this.controlWrap.addEventListener('touchstart', this.clickJudgeHandler);
		this.controlWrap.addEventListener('mousedown', this.clickJudgeHandler);
		this.controlWrap.addEventListener('touchstart', this.touchStartHandler);
		this.controlWrap.addEventListener('mousedown', this.mouseDownHandler);
	},
	removeDragStartListeners : function() {
		this.controlWrap.removeEventListener('touchstart', this.clickJudgeHandler);
		this.controlWrap.removeEventListener('mousedown', this.clickJudgeHandler);
		this.controlWrap.removeEventListener('touchstart', this.touchStartHandler);
		this.controlWrap.removeEventListener('mousedown', this.mouseDownHandler);
	},
	clickJudgeHandler : (evt)=>{ // click判定
		//console.log(this);
		let touchCount = 0;
		const clickDownCountBorder = 5;
		dragControlOBJ.clickFlg = true;
		const timerID = setInterval(function() {
			touchCount++
			if( touchCount > 0 ) {
				document.body.querySelector('.clickedPoint').classList.add('over');
			}
		}, 1*FRM);
		const judge = (evt)=>{
			//console.log('judge:::',touchCount, this.clickFlg);
			//document.getElementById('viewStatus').textContent = touchCount + ':::' + dragControlOBJ.clickFlg;
			clearInterval( timerID );
			//const clickDownCountBorder = 5;
			if( touchCount > clickDownCountBorder || !dragControlOBJ.clickFlg ) { return; }
			//document.getElementById('viewStatus').textContent = this;
			window.dispatchEvent( new KeyboardEvent('keydown', { key : 'Shift' }) );
			//
			window.removeEventListener('touchend', judge, { once : true });
			window.removeEventListener('mouseup', judge, { once : true });
		}
		window.addEventListener('touchend', judge, { once : true });
		window.addEventListener('mouseup', judge, { once : true });
	},
	touchStartHandler : (evt)=>{ // touch開始
		//if(evt.target !== dragControlOBJ.controlWrap) { return; } // <= 判定がうまくいかない…
		evt.preventDefault();
		document.querySelector('html').style['overscroll-behavior'] = 'none';
		//
		if(evt.touches.length === 1 ) {
			//console.log( evt.target );
			const rect = evt.target.getBoundingClientRect();
			const sendX = evt.touches[0].clientX - rect.x;
			const sendY = evt.touches[0].clientY - rect.y;
			dragControlOBJ.controlDragStart(sendX, sendY);
		}
		else if(evt.touches.length === 2 ) {
			if( document.body.querySelector('#pauseBtn').style['display'] != 'none' ) {
				// pauseボタンが表示されていたら....
				document.body.querySelector('#pauseBtn').dispatchEvent(new Event('click'));
			}
		}
	},
	mouseDownHandler : (evt)=>{ // mouseDown開始
		//console.log(evt.target);
		const sendX = evt.offsetX;
		const sendY = evt.offsetY;
		dragControlOBJ.controlDragStart(sendX, sendY);
	},
	controlDragStart : function( downX, downY ) { // drag開始
		//
		//初期値
		let pointX = 0;
		let pointY = 0;
		let direction = '';
		clearTimeout( this.clickJudgeTimerID );
		clearTimeout( this.rippleTimerID );
		//
		//const controlPoint = this.controlPoint;
		const pointRECT = this.controlPoint.getBoundingClientRect();
		//
		this.controlPoint.style['background-color'] = 'yellow';
		this.controlPoint.style['transition-duration'] = '0s';
		//
		this.controlPoint.style['left'] = pointX - pointRECT.width/2 + 'px';
		this.controlPoint.style['top'] = pointY - pointRECT.height/2 + 'px';
		//
		const clickedPoint = document.body.querySelector('.clickedPoint');
		clickedPoint.classList.remove('in');
		clickedPoint.classList.remove('over');
		clickedPoint.classList.remove('out');
		const checkedPointRECT = clickedPoint.getBoundingClientRect();
		clickedPoint.style['left'] = downX - checkedPointRECT.width/2 + 'px';
		clickedPoint.style['top'] = downY - checkedPointRECT.height/2 + 'px';
		clickedPoint.classList.add('in');
		//
		// 原点更新タイマー
		const originUpdataChecker = ()=>{
			this.originUpdataCount = 0;
			clearInterval( this.originUpdataTimerID );
			this.originUpdataTimerID = setInterval( ()=>{
				this.originUpdataCount++;
				if( this.originUpdataCount >= this.originUpdataTimeBorder ) {
					clearInterval( this.originUpdataTimerID );
				}
			}, 1*FRM );
		}
		if( document.getElementById('checkBoxDragChangeDirection').checked ) {
			originUpdataChecker();
		}
		//
		this.dragPaths = [];
		//
		// ドラッグ pointの移動処理
		const moveHandler = (evt)=>{
			evt.preventDefault();
			// 座標
			const deltaX = evt.offsetX - downX;
			const deltaY = evt.offsetY - downY;
			//
			const deltaLENGTH = Math.sqrt(deltaX**2 + deltaY**2);
			const clickBorder = 2;
			//
			if( deltaLENGTH > clickBorder ) { 
				//console.log('moveHandler:::', dragControlOBJ.clickFlg);
				dragControlOBJ.clickFlg = false;
			}
			// 連続操作のためのチェック
			if( deltaLENGTH > this.originUpdataLengthBorder && // 距離のボーダー
				this.originUpdataCount >= this.originUpdataTimeBorder ) { //時間のボーダー
				// 原点更新の見直し
				downX = evt.offsetX;
				downY = evt.offsetY;
				originUpdataChecker();
				//clickedPoint.style['left'] = downX - checkedPointRECT.width/2 + 'px';
				//clickedPoint.style['top'] = downY - checkedPointRECT.height/2 + 'px';
				return;
			}
			//
			const areaRECT = this.controlWrap.getBoundingClientRect();
			//
			const minX = -areaRECT.width/2 + pointRECT.width/2;
			const minY = -areaRECT.height/2 + pointRECT.height/2;
			const maxX = areaRECT.width/2 - pointRECT.width/2;
			const maxY = areaRECT.height/2 - pointRECT.height/2;
			//
			pointX = Math.min( Math.max( deltaX, minX ), maxX );
			pointY = Math.min( Math.max( deltaY, minY ), maxY );
			//
			this.controlPoint.style['left'] = pointX - pointRECT.width/2 + 'px';
			this.controlPoint.style['top'] = pointY - pointRECT.height/2 + 'px';
			//
			clickedPoint.classList.add('over');
			// 軌跡を描く
			const dragPath = new drawPath(
				document.body.querySelector('.pathWrap'),
				evt.clientX,
				evt.clientY,
				10
			);
			dragPath.view(); // 表示
			dragPath.start(); // 寿命開始
			//
			this.dragPaths.push( dragPath );
		}
		window.addEventListener('pointermove', moveHandler);
		//
		// moveの状態を監視してkeydownを生成
		let prevKey = '';
		const timerID = setInterval( ()=>{
			const tmp = this.judgeControl(pointX, pointY);
			if( tmp && prevKey !== tmp ) {
				//console.log('inInterval:::', focusOBJ.requestDir);
				window.dispatchEvent( new KeyboardEvent( 'keyup' ) );
				window.dispatchEvent( new KeyboardEvent( 'keydown', { key : tmp} ) ); // <- keydownに渡す
				prevKey = tmp;
			}
		}, 1*FRM);
		// timer list
		const controlTimerIDs = this.controlTimerIDs;
		controlTimerIDs.push(timerID);
		//document.getElementById('viewStatus').textContent =  controlTimerIDs.toString();
		//
		// ドラッグ 終了処理
		const upHandler = (evt)=>{
			window.dispatchEvent( new KeyboardEvent( 'keyup' ) );
			//clearInterval( timerID );
			//console.log('controlTimerIDs before:::', controlTimerIDs);
			clearInterval( controlTimerIDs.shift() );
			//console.log('controlTimerIDs after:::', controlTimerIDs);
			document.querySelector('html').style['overscroll-behavior'] = null;
			//
			// pathの自動消去始動
			for( const dPATH of this.dragPaths ) {
				//console.log(dPATH);
				dPATH.isAutoDelete = true;
			}
			// controlPointを初期位置に戻す
			this.controlPoint.style['background-color'] = null;
			this.controlPoint.style['transition-duration'] = null;
			this.controlPoint.style['left'] = 0 - pointRECT.width/2 + 'px';
			this.controlPoint.style['top'] = 0 - pointRECT.height/2 + 'px';
			//
			const clickedPoint = document.body.querySelector('.clickedPoint');
			clickedPoint.classList.remove('in');
			clickedPoint.classList.remove('over');
			clickedPoint.classList.add('out');
			this.rippleTimerID = setTimeout( function() { clickedPoint.classList.remove('out'); }, 800);
			//
			// リスナーの除去
			window.removeEventListener('pointermove', moveHandler);
			window.removeEventListener('touchend', upHandler);
			window.removeEventListener('mouseup', upHandler);
		}
		window.addEventListener('touchend', upHandler);
		window.addEventListener('mouseup', upHandler);
	},
	judgeControl : function( pointerX, pointerY ) { // 操作の判定
		// 解析
		//console.log(pointerX,pointerY);
		const rad = Math.atan2( pointerY, pointerX );
		const deg = (180*rad/Math.PI + 450 - this.delta )%360;
		//console.log('point deg:::', deg );
		//
		const border = 5;
		if( pointerX**2 + pointerY**2 < border**2 ) { return false; }
		//
		if( 45 < deg && deg <= 135 ) { return 'ArrowRight'; }
		else if( 135 < deg && deg <= 225 ) { return 'ArrowDown'; }
		else if( 225 < deg && deg <= 315 ) { return 'ArrowLeft'; }
		else { return 'ArrowUp'; }
		//
	},
};
//
// 現在のDice状態群
const currentViewOBJ = {
	init : function() {
		this.view = document.body.querySelector('.currentView');
		this.dice = new Dice();
		//
		this.dice.putOnStage( this.view );
	},
	updata : function( targetDice = null ) {
		//console.log('currentViewOBJ.updata');
		if(targetDice === false || targetDice === null) {
			console.log('targetDiceなし');
			this.dice.element.style['visibility'] = 'hidden';
			return;
		}
		else if(targetDice === floorDice) {
			//console.log('床上');
			this.dice.element.style['visibility'] = 'hidden';
			return;
		}
		this.dice.element.style['visibility'] = 'visible';
		// 賽の目情報の反映
		this.dice.surface['Top']['face'] = targetDice.surface['Top']['face']
		this.dice.surface['Bottom']['face'] = targetDice.surface['Bottom']['face']
		this.dice.surface['Left']['face'] = targetDice.surface['Left']['face']
		this.dice.surface['Right']['face'] = targetDice.surface['Right']['face'];
		this.dice.surface['Up']['face'] = targetDice.surface['Up']['face'];
		this.dice.surface['Down']['face'] = targetDice.surface['Down']['face'];
		this.dice.surface['Top']['nextFace'] = targetDice.surface['Top']['nextFace'];
		this.dice.surface['Bottom']['nextFace'] = targetDice.surface['Bottom']['nextFace'];
		this.dice.surface['Left']['nextFace'] = targetDice.surface['Left']['nextFace'];
		this.dice.surface['Right']['nextFace'] = targetDice.surface['Right']['nextFace'];
		this.dice.surface['Up']['nextFace'] = targetDice.surface['Up']['nextFace'];
		this.dice.surface['Down']['nextFace'] = targetDice.surface['Down']['nextFace'];
		this.dice.surface['Top']['rotate'] = targetDice.surface['Top']['rotate'];
		this.dice.surface['Bottom']['rotate'] = targetDice.surface['Bottom']['rotate'];
		this.dice.surface['Left']['rotate'] = targetDice.surface['Left']['rotate'];
		this.dice.surface['Right']['rotate'] = targetDice.surface['Right']['rotate'];
		this.dice.surface['Up']['rotate'] = targetDice.surface['Up']['rotate'];
		this.dice.surface['Down']['rotate'] = targetDice.surface['Down']['rotate'];
		//
		//表面の更新
		this.dice.updataFace();
	}
};
//
// score処理群
const scoreOBJ = {
	scoreElmt : document.body.querySelector('.scoreView .gameText'),
	hiScoreElmt : document.body.querySelector('.hiScoreView .gameText'),
	usrScore : 0,
	viewScore : 0,
	hiScore : 0,
	updata : function( LOOP = false ) { // 表示用得点の更新 LOOP: true:独立して処理
		// scoreは、intで減算はなし
		//console.log('LOOP::::',LOOP);
		//console.log( this.viewScore, this.usrScore );
		if( this.viewScore < this.usrScore ) { // 表示スコアがユーザースコアより小さければ...
			this.viewScore++;
			// 点数
			this.updataView( this.viewScore, this.scoreElmt );
			// ハイスコア
			if( this.hiScore < this.viewScore ) { // 表示スコアがハイスコアより小さければ...
				this.hiScore = this.viewScore;
				this.updataView( this.hiScore, this.hiScoreElmt );
			}
			// ループ指定
			if( LOOP ) {
				setTimeout( function() {
					scoreOBJ.updata( true );
				}, 1*FRM ); // <--　ループ指定
			}
		}
	},
	updataView : function( SCORE, ELMT ) { // 得点表示の更新
		// 桁毎に代入
		for(let i=1; i<=10; i++ ) {
			// i桁目
			const temp = Math.floor( SCORE / (10 ** (i-1)) );
			ELMT.querySelector( '.kt'+i ).textContent = temp%10;
			if( temp > 0 ) {
				ELMT.querySelector( '.kt'+i ).classList.remove('disabled');
			}
			else {
				ELMT.querySelector( '.kt'+i ).classList.add('disabled');
			}
		}

	},
	calcScore : function( FACE, chainDeleteTotal, chainNum ) { // 得点計算
		scoreOBJ.usrScore += FACE * chainDeleteTotal * ( chainNum + 1 );
	},	
};
// 時計オブジェクト
const timerOBJ = {
	elmt : document.querySelector('.timeView .gameText'),
	bestTimeElmt : document.querySelector('.bestTimeView .gameText'),
	now : new Date(),
	timeLimit : 0,
	timeUpIs : false,
	startTime : 0,
	stopTime: 0,
	elapsedTime : 0,
	timerFlg : false,
	timerID : 0,
	pauseFlg : false,
	setStartTime : function() {
		this.stopTime = 0;
		this.elapsedTime = 0;
		this.startTime = (new Date()).getTime();
		this.timeUpIs = false;
		this.elmt.classList.remove('LIMIT');
		this.elmt.classList.remove('LIMITani');
	},
	getPastTime : function() {
		return ((new Date()).getTime() - this.startTime) + this.elapsedTime;
	},
	viewUpdata : function( MESSAGE, CLS = null ) {
		//console.log('MESSAGE:::',MESSAGE);
		//
		this.inputTo( MESSAGE, this.elmt );
		//
		this.elmt.classList.remove('LIMIT');
		this.elmt.classList.remove('LIMITani');
		if(CLS != null) {
			this.elmt.classList.add(CLS);
		}
	},
	viewUpdataAtBest : function( MESSAGE ) {
		//console.log('MESSAGE:::',MESSAGE);
		//
		this.inputTo( MESSAGE, this.bestTimeElmt );
	},
	inputTo : function( MESSAGE, ELEMENT ) {
		// ms
		ELEMENT.querySelector('.ms1').textContent = MESSAGE.ms % 10
		ELEMENT.querySelector('.ms2').textContent = Math.floor(MESSAGE.ms/10)%10;
		ELEMENT.querySelector('.ms3').textContent = Math.floor(MESSAGE.ms/100);
		// sec
		ELEMENT.querySelector('.sec1').textContent = MESSAGE.sec % 10
		ELEMENT.querySelector('.sec2').textContent = Math.floor(MESSAGE.sec/10);
		// min
		ELEMENT.querySelector('.min1').textContent = MESSAGE.min % 10
		ELEMENT.querySelector('.min2').textContent = Math.floor(MESSAGE.min/10)%10;
		ELEMENT.querySelector('.min3').textContent = Math.floor(MESSAGE.min/100);
	},
	start : function() { // timer開始
		this.setStartTime(); // 開始用
		this.timerFlg = true;
		this.pauseFlg = false;
		this.timerID = setTimeout( () => { // loop設定
			this.timerLoop();
		}, 1*FRM);
	},
	stop : function() { // timer停止 & stopTime格納
		this.timerFlg = false;
		this.pauseFlg = false;
		console.log()
		//
		clearTimeout( this.timerID );
		this.timerLoop();
	},
	pause : function() { // timer一時停止
		this.pauseFlg = true;
		// 経過時間を待避
		this.elapsedTime = timerOBJ.getPastTime();
	},
	resume : function() { // timer再開
		this.pauseFlg = false;
		// timerの再起動
		this.startTime = (new Date()).getTime();
		this.timerID = setTimeout( () => { // loop設定
			this.timerLoop();
		}, 1*FRM);
	},
	timerLoop : function() { //ストップウォッチのループ関数
		//console.log('timerLoop:::',this.timerFlg);
		// pause処理
		if( this.pauseFlg ) {
			console.log('timerLoop pause');
			return;
		}
		// 時間表示処理
		const pastTime = this.getPastTime();
		let TIME = this.timeLimit - pastTime;
		let cls = null;
		if( this.timeLimit > 0 && TIME <= 10*1000) {
			cls = 'LIMITani'
		}
		if( this.timeLimit > 0 && TIME <= 0) {
			this.timerFlg = false;
			this.timeUpIs = true;
			TIME = 0;
			cls = 'LIMIT'
		}
		TIME = Math.abs(TIME);
		this.viewUpdata( this.setFormat(TIME), cls);
		//
		//console.log('timerCHECK:::',this.timerFlg);
		if( this.timerFlg ) {
			this.timerID = setTimeout( () => { // loop設定
				this.timerLoop();
			}, 1*FRM);
		}
		else {
			this.stopTime = pastTime;
		}
	},
	setFormat : function( milliSeconds ) {
		const min = String(Math.floor(milliSeconds/(60*1000))).padStart(2,0);
		const sec = String(Math.floor(milliSeconds/1000)%60).padStart(2,0);
		const ms = String(milliSeconds%1000).padStart(3,0);
		//return `${min}:${sec}.${ms}`;
		return {
			min : min,
			sec : sec,
			ms : ms,
		};
	},
	viewFormat : function( milliSeconds ) {
		const temp = this.setFormat( milliSeconds );
		return `${temp.min}:${temp.sec}.${temp.ms}`;
	}
};
// maxChain 表示処理群
const maxChainOBJ = {
	elmt : document.body.querySelector('.maxChainView .gameText'),
	updata : function( LIST ) {
		for(let i=1; i<6; i++) {
			//console.log(i,':::',LIST[i]);
			this.updataView( i+1, LIST[i], this.elmt );
		}
	},
	updataView : function( FACE, SCORE, ELMT ) { // 得点表示の更新
		// 桁毎に代入
		for(let i=1; i<=2; i++ ) {
			// i桁目
			const temp = Math.floor( SCORE / (10 ** (i-1)) );
			const target = ELMT.querySelector( `.kt${FACE}${i}` );
			target.textContent = temp%10;
			if( temp > 0 ) {
				target.classList.remove('disabled');
			}
			else {
				target.classList.add('disabled');
			}
		}

	},
};
// scoreWrap 表示処理群
const scoresWrapViewOBJ = {
	members : [
		'hiScoreView', 'scoreView',
		'bestTimeView', 'timeView',
		'maxChainView',
	],
	hiScoreViewIs : true,
	scoreViewIs : true,
	bestTimeViewIs : true,
	timeViewIs : true,
	maxChainViewIs : true,
	updataView : function() { // 表示を更新
		console.log('updataView check');
		const scoresWrap = document.body.querySelector('.scoresWrap');
		for( const MEMBER of this.members ) {
			//console.log(MEMBER + ':::' + this[ MEMBER + 'Is' ]);
			const viewElmt = scoresWrap.querySelector( '.' + MEMBER );
			if( this[ MEMBER + 'Is' ] ) {
				viewElmt.classList.remove('shrink');
			}
			else {
				viewElmt.classList.add('shrink');
			}
		}
		// scoresWrapView
	},
};
//
// debug表示類
const forDebugOBJ = {
	// ゲーム情報の表示関係
	stageMapHTML : ``,
	checkedMapHTML : ``,
	diceStHTML : ``,
	controlStHTML : ``,
	deleteInfoHTML : ``,
	viewVal : function (){ // ゲーム情報の表示
		const valView = document.body.querySelector('.valview');
		//
		this.stageMapHTML = `
			<div class="viewVal">${stageOBJ.map[0]}</div>
			<div class="viewVal">${stageOBJ.map[1]}</div>
			<div class="viewVal">${stageOBJ.map[2]}</div>
			<div class="viewVal">${stageOBJ.map[3]}</div>
			<div class="viewVal">++++++++++++++</div>
		`;
		this.checkedMapHTML = `
			<div class="viewVal">${stageOBJ.checkedMap[0]}</div>
			<div class="viewVal">${stageOBJ.checkedMap[1]}</div>
			<div class="viewVal">${stageOBJ.checkedMap[2]}</div>
			<div class="viewVal">${stageOBJ.checkedMap[3]}</div>
			<div class="viewVal">${stageOBJ.linkDiceList}</div>
			<div class="viewVal">++++++++++++++</div>
		`;
		this.diceStHTML = `			
			<div class="viewVal">current:::${currentFace_global}</div>
			<div class="viewVal">---next:::${nextFace_global}</div>
			<div class="viewVal">focusST:::${focusStatus_global}</div>
			<div class="viewVal">footST::::${footStatus_global}</div>
			<div class="viewVal">--Dices:::${diceHelper.list.length}</div>
		`;
		// ゲーム状態表示 HTML
		this.deleteInfoHTML = `<div class="viewVal">list:::::::::01,02,03,04,05,06</div>`;
		this.deleteInfoHTML += `<div class="viewVal">maxC:::::`+String(maxChainList[0]).padStart(2,'0');
		for(let i=1; i<maxChainList.length; i++) {
			this.deleteInfoHTML += ','+String(maxChainList[i]).padStart(2,'0');
		}
		this.deleteInfoHTML += `<div class="viewVal">chain:::::`+String(chainNumList[0]).padStart(2,'0');
		for(let i=1; i<chainNumList.length; i++) {
			this.deleteInfoHTML += ','+String(chainNumList[i]).padStart(2,'0');
		}
		this.deleteInfoHTML += `<div class="viewVal">chainD:::`+String(chainDeleteTotalList[0]).padStart(2,'0');
		for(let i=1; i<chainNumList.length; i++) {
			this.deleteInfoHTML += ','+String(chainDeleteTotalList[i]).padStart(2,'0');
		}
		this.deleteInfoHTML += '</div>';
		this.deleteInfoHTML += `<div class="viewVal">delete::::`+String(deleteNumList[0]).padStart(2,'0');
		for(let i=1; i<deleteNumList.length; i++) {
			this.deleteInfoHTML += ','+String(deleteNumList[i]).padStart(2,'0');
		}
		this.deleteInfoHTML += '</div>';
		//
		let mesHTML = this.stageMapHTML;
		//mesHTML += checkedMapHTML;
		mesHTML += this.diceStHTML;
		mesHTML += this.controlStHTML;
		mesHTML += '<div class="viewVal">***********</div>';
		mesHTML += this.deleteInfoHTML;
		//
		valView.innerHTML = mesHTML;
	},
};
//