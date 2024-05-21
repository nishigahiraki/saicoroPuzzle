'use strict';
//
// フレーム
const FPS = 32;
const FRM = 1000 / FPS;
//
let currentFace_global = 0;
let nextFace_global = 0;
let focusStatus_global = 0;
let footStatus_global = 0;
//
let maxChainList = [0,0,0,0,0,0];
let chainNumList = [0,0,0,0,0,0];
let deleteNumList = [0,0,0,0,0,0];
let chainDeleteTotalList = [0,0,0,0,0,0];
//
// ゲームのmainタイマー
//let gameMainTimer_id = 0;
// pauseフラグ
let isPause = false;
//
// dices生成タイマー
//const newDiceINTERVAL = 10*1000;
let newDiceINTERVAL_id = 0;
let onGameLoop_id = 0;
let keydownINTERVAL_id = 0;
//
// ゲームモード
let selectedGameMode = 0;
const gameModeLIST = ['DebugMode','TimeTrial2min','Servival','dice10Challenge','practice'];
const pauseMenuLIST = ['resumeBtn', 'giveupBtn', 'backTitleBtn'];
const gameoverSelectLIST = ['retryBtn', 'rankingBtn', 'backTitleBtn'];
//
// 各ゲームモードのscoreを待避
const userScoreLIST = [100, 100, 100, 100, 100, 100];
const userTimeLIST = [0, 2*60*1000, 0, 60*60*1000, 0];
//
let bestTime = 0;
//const hiScoreView = document.body.querySelector('.hiScoreView .gameText');
//hiScoreView.textContent = String(hiScore).padStart(10,0);
//scoreOBJ.updataView( scoreOBJ.hiScore, scoreOBJ.hiScoreElmt );
// ranking.phpを監視して、hiScoreをロードする
document.addEventListener('DOMContentLoaded', function(evt) {
	document.querySelector('iframe.rankingView').addEventListener('load', function(evt) {
		console.log('phploaded');
		//console.log('hiScore get test:::', document.querySelector('iframe.rankingView').contentWindow.hiScore_Ranking);
		// スコア
		try{
			scoreOBJ.hiScore = userScoreLIST[gameSelectorOBJ.pos];
			const getHiScore = document.querySelector('iframe.rankingView').contentWindow.hiScore_Ranking;
			if( getHiScore !== undefined ) { scoreOBJ.hiScore = getHiScore; }
			//hiScoreView.textContent = String(hiScore).padStart(10,0);
		}
		catch(error) {
			console.log('catch iframe hiScore::::',error);
			//hiScoreView.textContent = String(scoreOBJ.hiScore).padStart(10,0);
		}
		scoreOBJ.updataView( scoreOBJ.hiScore, scoreOBJ.hiScoreElmt );
		//
		// タイム
		try{
			bestTime = userTimeLIST[gameSelectorOBJ.pos];
			if( document.body.querySelector('.gameSelectView').classList.contains('open') ) {
				switch(gameModeLIST[gameSelectorOBJ.pos]) {
					case 'TimeTrial2min' :
					case 'Servival' :
						const getMaxTime = document.querySelector('iframe.rankingView').contentWindow.bestTimeMax_Ranking;
						if( getMaxTime !== undefined ) { bestTime = getMaxTime; }
					break;
					case 'dice10Challenge' :
						const getMinTime = document.querySelector('iframe.rankingView').contentWindow.bestTimeMin_Ranking;
						if( getMinTime !== undefined ) { bestTime = getMinTime; }
					break;
				}
			}
		}
		catch(error) {
			console.log('catch iframe bestTime::::',error);
			//hiScoreView.textContent = String(scoreOBJ.hiScore).padStart(10,0);
		}
		timerOBJ.viewUpdataAtBest( timerOBJ.setFormat(bestTime) );
	});
});
//
// ゲーム読み込み時のdice設定
function firstDiceInit() {
	// 初期設定をリセット
	diceHelper.list.length = 0;
	const target = document.body.querySelector('.diceWrap');
	while( target.children.length > 0 ) {
		target.removeChild(target.lastChild);
	}
	//
	while( diceHelper.list.length < 1 ) {
		diceHelper.list.push( new Dice() );
	}
	//console.log(diceHelper.list);
	//
	diceHelper.list[0].putOnStage( document.body.querySelector('.diceWrap') );
	diceHelper.list[0].setPos(2, 2);
	diceHelper.list[0].setFace(1, 3, 2);
}
// テストの場合の設定
/*
 testIs = true;if(testIs) {
	// 初期設定をリセット
	diceHelper.list.length = 0;
	const target = document.body.querySelector('.diceWrap');
	while( target.children.length > 0 ) {
		target.removeChild(target.lastChild);
	}
	//
	while( diceHelper.list.length < 1 ) {
		diceHelper.list.push( new Dice() );
	}
	console.log(diceHelper.list);
	//
	diceHelper.list[0].putOnStage( document.body.querySelector('.diceWrap') );
	diceHelper.list[0].setPos(2, 2);
	diceHelper.list[0].setFace(1, 3, 2);
	//
	// diceHelper.list[1].putOnStage( document.body.querySelector('.diceWrap') );
	// diceHelper.list[1].setPos(2, 3);
	// diceHelper.list[1].setFace(2, 4, 1);
	// //
	// diceHelper.list[0].putOnStage( document.body.querySelector('.diceWrap') );
	// diceHelper.list[0].setPos(2, 2);
	// diceHelper.list[0].setFace(2, 3, 6);
	// //
	// diceHelper.list[2].putOnStage( document.body.querySelector('.diceWrap') );
	// diceHelper.list[2].setPos(3, 2);
	// diceHelper.list[2].setFace(1, 2, 3);
	// //
	// diceHelper.list[3].putOnStage( document.body.querySelector('.diceWrap') );
	// diceHelper.list[3].setPos(3, 4);
	// diceHelper.list[3].setFace(2, 3, 1);
	// //
	// diceHelper.list[0].deleteLife = 180;
	// diceHelper.list[0].updataDiceHeightByDeleteLife();
	// diceHelper.list[2].deleteLife = 70;
	// diceHelper.list[2].updataDiceHeightByDeleteLife();
	// //
	console.log(diceHelper.list);
}
*/
/* diceの開始状態を記録
let diceHelper.backupList =[];
function diceHelper.backupListFunc( LIST ) {
	diceHelper.backupList =[];
	for(let index=0; index<LIST.length; index++) {
		backupDicesInfo.push( {
			'topNum' : LIST[index].surface['Top']['face'],
			'rightNum' : LIST[index].surface['Right']['face'],
			'downNum' : LIST[index].surface['Down']['face'],
			'posX' : LIST[index].posX,
			'posY' : LIST[index].posY,
		} );
	}
}
*/
//backupDicesInfoFunc( diceHelper.list );
//
// 使用メモリの確認用
//setInterval(() => { getMemory(); }, 1000);
function getMemory() {
	const memoryView = document.getElementById('viewMemory');
	//memoryView.textContent = `${(Navigator.deviceMemory / 1024).toFixed(2)} KB`;
	memoryView.textContent = `${(performance.memory.usedJSHeapSize / 1024).toFixed(2)} KB`;
}

// 床
const floorDice = new Dice();
floorDice.surface['Top']['face'] = floorDice.surface['Top']['nextFace'] = 0;
floorDice.deleteLife = 0;
//
// ページロード時init
window.addEventListener('load', function(evt) {
	console.log('onload');
	// 表示サイズの調整
	// const bodyWidth = document.body.clientWidth;
	// const scale = bodyWidth<480 ? bodyWidth/480 : 1;
	// document.body.querySelector('.screenWrap').style['transform-origin'] = `left top`;
	// document.body.querySelector('.screenWrap').style['transform'] = `scale(${scale})`;
	// ウィンドウの監視
	windowAreaCheck(); // レイアウト更新
	window.addEventListener('resize', windowAreaCheck);
	//
	stageOBJ.updata();
	firstDiceInit(); // 最初のdiceの初期配置
	//
	diceHelper.players = diceHelper.list[0];
	focusOBJ.setDir( focusOBJ.currentDir );
	focusOBJ.setPos( diceHelper.players.posX, diceHelper.players.posY );
	//
	currentViewOBJ.init(); // 現在のdice状態表示の初期化
	currentViewOBJ.updata(diceHelper.list[0]); // 現在のdice状態表示の更新
	//
	// ゲームロード直後表示
	titleViewFunc();
	// ゲームメニュー画面へ
	viewGameMenuFunc();
});
// ウィンドウの監視
function windowAreaCheck() {
	const bodyWidth = document.body.clientWidth;
	const scale = bodyWidth<480 ? bodyWidth/480 : 1;
	console.log('scale:::',scale);

	const screenWrap = document.body.querySelector('.screenWrap');
	screenWrap.style['transform-origin'] = `left top`;
	screenWrap.style['transform'] = `scale(${scale})`;
	const gameView = document.body.querySelector('.gameView');
	gameView.style['height'] = 480*scale+`px`;
	// スコア群 表示位置の設定
	const scoresWrap = document.body.querySelector('.scoresWrap');
	scoresWrap.style['transform-origin'] = `left top`;
	scoresWrap.style['transform'] = `scale(${scale})`;
	// gameMode群 表示位置の設定
	const gameSelectView = document.body.querySelector('.gameSelectView');
	gameSelectView.style['transform-origin'] = `left bottom`;
	gameSelectView.style['transform'] = `scale(${scale})`;
	const gameModeInfoView = document.body.querySelector('.gameModeInfoView');
	gameModeInfoView.style['transform-origin'] = `right bottom`;
	gameModeInfoView.style['transform'] = `scale(${scale})`;
}
// gameModeInfoの挙動設定 (まとめて設定)
const gameModeBtns = [];
for(let i=0; i<gameModeLIST.length; i++) {
	const BTN = document.body.querySelector('#' + gameModeLIST[i]);
	gameModeBtns.push(BTN); // 念の為退避
	// リスナー設定
	BTN.addEventListener('click', gameSelectFunc);
}
function gameSelectFunc(evt) {
	//console.log(this.id);
	const targetBTN = document.body.querySelector(`#${this.id}`);
	if( targetBTN.classList.contains('selected') ) {
		// 選択済みだったら・・・
		document.body.querySelector('#gameStartBtn').dispatchEvent(new Event('click'));
		return;
	}
	// gameModeのハイスコアをロード　　=> ranking.phpを読み込む
	//document.querySelector("iframe.rankingView").contentWindow.location.reload();
	if( this.id === 'TimeTrial2min' ||
		 this.id === 'Servival' ) {
		submitRankingFunc(this.id, null, null, 'score', false);
	}
	else if( this.id === 'dice10Challenge' ) {
		submitRankingFunc(this.id, null, null, 'time', false);
	}
	else {
		// 自己記録からの読み込み
		scoreOBJ.hiScore = userScoreLIST[gameSelectorOBJ.pos];
		scoreOBJ.updataView( scoreOBJ.hiScore, scoreOBJ.hiScoreElmt );
		timerOBJ.viewUpdataAtBest( timerOBJ.setFormat(userTimeLIST[gameSelectorOBJ.pos]) );
	}
	//
	// gameModeの選択状態のクリア
	for(let i=0; i<gameModeLIST.length; i++) {
		const BTN = document.body.querySelector(`#${gameModeLIST[i]}`);
		BTN.classList.remove('focus');
		BTN.classList.remove('selected');
		const INFO = document.body.querySelector(`.gameModeInfo.${gameModeLIST[i]}`);
		INFO.classList.remove('open');
	}
	//
	// gameModeを選択状態に
	targetBTN.classList.add('selected');
	targetBTN.classList.add('focus');
	const targetINFO = document.body.querySelector(`.gameModeInfo.${this.id}`);
	targetINFO.classList.add('open');
	//
	selectedGameMode = gameModeLIST.indexOf(this.id);
	//console.log('selectedGameMode:::', selectedGameMode);
	//
	gameSelectorOBJ.pos = selectedGameMode; // 選択を待避
	targetBTN.focus();
}
//
/* サイコロの位置設定
function setDicePos(posX, posY) {
    const dice_ele = document.body.querySelector('.dice');
    helperOBJ.setCSS(dice_ele, '--posX', posX);
    helperOBJ.setCSS(dice_ele, '--posY', posY);
}
*/
// diceの初期設定
//let diceHelper.players = diceHelper.list[0];
// playerのfocus
//updataPlayerFocus( diceHelper.players.posX, diceHelper.players.posY )
// focusOBJ.setDir( focusOBJ.currentDir );
// focusOBJ.setPos( diceHelper.players.posX, diceHelper.players.posY );
//
//let diceHelper.canDiceMove = true;
//let gameSelectorPos = 0;
//
//
// keyリスナー
window.addEventListener('keydown', keyCheck);
function keyCheck(evt) {
	//console.log(evt.key);
	document.body.querySelector('#viewStatus').textContent = evt.key;
	//
	const gameInfomationWrap = document.body.querySelector('.gameInfomationWrap');
	if( gameInfomationWrap.classList.contains('open') ) {
		infomationClickHandler(); // infomationをクリックしたことにする。
		return;
	}
	//
	window.dispatchEvent(new Event('gameStart')); // gameStartの発行 <= 条件要検討
	gameSelectorOBJ.updata( evt.key ); // 押下キー確認用
	//
	if(evt.key == 'ArrowLeft' || evt.key == 'ArrowRight' || evt.key == 'ArrowUp' || evt.key == 'ArrowDown') {
		controlOBJ.isKeyup = false;
		evt.preventDefault();
	}
	else if(createDiceByShiftIs && evt.key == 'Shift') { diceHelper.addNewDiceOnGame(); evt.preventDefault(); return; }
	else if(evt.key === ' ') { evt.preventDefault(); console.log('================'); return; }
	else if(evt.key === 'Escape' ) {
		//console.log( document.body.querySelector('#pauseBtn').style['display'] !== 'none' );
		if(document.body.querySelector('.resultView').classList.contains('open')) {
			// Result表示時にwindowをescapeする処理
			document.body.querySelector('.gamebtn.no').dispatchEvent(new Event('click'));
		}
		else if( document.body.querySelector('#pauseBtn').style['display'] != 'none' ) {
			// give upボタンが表示されていたら....
			document.body.querySelector('#pauseBtn').dispatchEvent(new Event('click'));
		}
		return;
	}
	else if( evt.key === 'Alt' && document.body.querySelector('.debugView').classList.contains('open') ) {
		document.body.querySelector('#deleteBtn').dispatchEvent(new Event('click'));
		return;
	}
	else { return; }
	//
	// 以下 Arrow　keyのみ到達
	// keydownだけでは操作としては遅いっぽいので、keyupまでフレーム毎に排出する様に変更
	//window.removeEventListener('keydown', keyCheck);
	//
	// actionKeyから'Arrow'を抜く
	const direction = (evt.key).slice('Arrow'.length);
	//
	// 判定ループの設定
	clearInterval( keydownINTERVAL_id );
	keydownINTERVAL_id = setInterval( function() {
		// focusに操作要求を出す
		focusOBJ.requestDir = direction;
	}, 1*FRM );
	//
	window.addEventListener('keyup', keyupHandler);
	function keyupHandler(evt) {
		window.removeEventListener('keyup', keyupHandler);
		//window.addEventListener('keydown', keyCheck);
		document.body.querySelector('#viewStatus').textContent = '';
		clearInterval( keydownINTERVAL_id );
		controlOBJ.isKeyup = true;
	}
}
//
// 操作のチェック
function controlCheck( direction ) {
	//console.log('request:::',direction);
	if( isPause ) { return; } // pauseの時はスルー
	if( !focusOBJ.canRequest ) { return; }
	// forcusで位置取り
	const currentX = helperOBJ.getCSS(focusOBJ.elemt, '--posX', false);
	const currentY = helperOBJ.getCSS(focusOBJ.elemt, '--posY', false);
	//console.log(currentX,currentY);
	// 次のポジション
	let nextX = currentX;
	let nextY = currentY;
	// 次の向こう側
	let overX = currentX;
	let overY = currentY;
	//
	// player focusの向き
	const delta = focusOBJ.turnJudge(direction);
	if( delta !== false ) {
		focusOBJ.rotate( focusOBJ.currentDir + delta ); // focusの回転処理
		return; // focusが進行方向に向いていない時は進行方向の設定のみ
	}
	//
	if( focusOBJ.elemt.classList.contains('TRANSLATE') ||
		!diceHelper.canDiceMove ) { 
		//console.log('request:::',direction,'動作中スルー');
		return false; // 動作中ならスルー
	}
	// 操作のチェック
	// ポジション出し
	switch( direction ) {
		case 'Left' :
			nextX = currentX > 1 ? currentX-1 : 1;
			overX = nextX > 1 ? nextX-1 : 1;
		break;
		case 'Right' :
			nextX = (currentX+1 < stageOBJ.maxSizeX) ? currentX+1 : stageOBJ.maxSizeX;
			overX = (nextX+1 < stageOBJ.maxSizeX) ? nextX+1 : stageOBJ.maxSizeX;
		break;
		case 'Up' :
			nextY = currentY > 1 ? currentY-1 : 1;
			overY = nextY > 1 ? nextY-1 : 1;
		break;
		case 'Down' :
			nextY = (currentY+1 < stageOBJ.maxSizeY) ? currentY+1 : stageOBJ.maxSizeY;
			overY = (nextY+1 < stageOBJ.maxSizeY) ? nextY+1 : stageOBJ.maxSizeY;
		break;
	}
	//
	// 動作判定
	controlOBJ.behaviorJudge(
		[currentX, currentY],
		[nextX, nextY],
		[overX, overY],
		direction,
	);
	//
	// focusの現在の立ち位置 と 次の高さ (通常dice:100, 床:0)
	const currentDice = diceHelper.getDiceByPosition( currentX, currentY );
	const currentHeight = focusOBJ.height;
	const nextDice = diceHelper.getDiceByPosition( nextX, nextY );
	const nextHeight = ( nextDice != false ) ? nextDice.height : 0;
	const differenceHeight = Math.abs(nextHeight) - Math.abs(currentHeight);
	const limitHEIGHT = 60;
	//
	/*
	console.log('current:::',currentHeight,currentDice);
	console.log('next::::::',nextHeight,nextDice);
	console.log('differenceHeight:::',differenceHeight)
	*/
	// mapのチェック
	currentFace_global = `Map:${stageOBJ.map[currentY-1][currentX-1]},H:${currentHeight},F:${currentDice!=false?currentDice.getTopFace():0}`;
	nextFace_global = `Map:${stageOBJ.map[nextY-1][nextX-1]},H:${nextHeight},F:${nextDice!=false?nextDice.getTopFace():0}`;
	//
	//stageOBJ.updata();
	// console.log('currentMap:::',stageOBJ.map[currentY-1][currentX-1]);
	// console.log('nextMap:::',stageOBJ.map[nextY-1][nextX-1]);
	//
} 
//
// GAME start
// メニューの表示時処理 [スタート画面(ゲーム選択)]
function viewGameMenuFunc() {
	console.log('viewGameMenuFunc');
	// timer初期化
	clearInterval( newDiceINTERVAL_id );
	clearInterval( onGameLoop_id );
	// ゲーム画面の設定
	gameMenuViewFunc();
	document.body.querySelector('.screenWrap').classList.remove('st-DEAD');
	document.body.querySelector('.currentViewWrap').classList.remove('st-DEAD');
	// pauseボタンの非表示
	document.body.querySelector('#pauseBtn').style['display'] = 'none';
	// スコア類の表示
	document.body.querySelector('.hiScoreView').style['display'] = null;
	document.body.querySelector('.scoreView').style['display'] = null;
	document.body.querySelector('.timeView').style['display'] = null;
	// ゲームモード表示のclose
	document.body.querySelector('.gameModeView').classList.remove('open');
	// gameModeウィンドウのopen
	document.body.querySelector('.gameSelectView').style['display'] = null;
	document.body.querySelector('.gameSelectView').classList.add('open');
	document.body.querySelector('.gameModeInfoView').style['display'] = null;
	//
	// メニュー
	gameSelectorOBJ.init(gameModeLIST, 0);
	//
	// scoresWrapの表示更新
	scoresWrapViewOBJ.hiScoreViewIs = true;
	scoresWrapViewOBJ.scoreViewIs = false;
	scoresWrapViewOBJ.bestTimeViewIs = true;
	scoresWrapViewOBJ.timeViewIs = false;
	scoresWrapViewOBJ.maxChainViewIs = true;
	scoresWrapViewOBJ.updataView();
	//
	// debug ウィンドウ
	if( !document.body.querySelector('#checkBoxDebugView').checked ) {
		document.body.querySelector('.debugView').classList.remove('open');
	}
	//
	// deleteLogの初期化
	diceHelper.deleteLog = [];
}
// ゲームルール格納OBJ
const gameRules = { // ゲーム条件
	createDiceDuration : 5000,
	createDiceByShift : false,
	createDiceTop2 : false,
	allDeleteIsClear : false,
	limitTime : 2*60*1000,
	startDiceNum : 6,
	starPos : [2,2],
	viewStatus : true,
	viewViewContorol : true,
	viewHiScore : true,
	viewScore : true,
	viewBestTime : true,
	viewTime : true,
	viewMaxChain : true,
	recordIs : false,
}
function gameStartFunc( MODE ) {
	console.log('gameStartFunc');
	const mode = gameModeLIST[MODE];
	document.body.querySelector('.gameModeView').textContent = mode;
	document.body.querySelector('.gameModeView').classList.add('open');
	// ゲームモード選択の初期化
	//gameSelectorOBJ.pos = -1;
	// ゲームルールの設定
	switch( mode ) {
		case 'DebugMode': 
			gameRules['createDiceDuration'] = -1;
			gameRules['createDiceByShift'] = true;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = 0; //
			gameRules['startDiceNum'] = 0;
			gameRules['starPos'] = [2,2];
			gameRules['viewStatus'] = true;
			gameRules['viewViewContorol'] = true;
			gameRules['viewHiScore'] = false;
			gameRules['viewScore'] = true;
			gameRules['viewBestTime'] = false;
			gameRules['viewTime'] = true;
			gameRules['viewMaxChain'] = true;
			gameRules['recordIs'] = false;
		break;
		case 'TimeTrial2min': 
			gameRules['createDiceDuration'] = 5*1000;
			gameRules['createDiceByShift'] = false;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = 2*60*1000;
			gameRules['startDiceNum'] = 6;
			gameRules['starPos'] = -1;
			gameRules['viewStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewHiScore'] = true;
			gameRules['viewScore'] = true;
			gameRules['viewBestTime'] = false;
			gameRules['viewTime'] = true;
			gameRules['viewMaxChain'] = false;
			gameRules['recordIs'] = 'score';
		break;
		case 'Servival': 
			gameRules['createDiceDuration'] = 10*1000;
			gameRules['createDiceByShift'] = false;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = 0;
			gameRules['startDiceNum'] = 6;
			gameRules['starPos'] = -1;
			gameRules['viewStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewHiScore'] = true;
			gameRules['viewScore'] = true;
			gameRules['viewBestTime'] = false;
			gameRules['viewTime'] = true;
			gameRules['viewMaxChain'] = true;
			gameRules['recordIs'] = 'score';
		break;
		case 'dice10Challenge': 
			gameRules['createDiceDuration'] = -1;
			gameRules['createDiceByShift'] = false;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = true;
			gameRules['limitTime'] = 0;
			gameRules['startDiceNum'] = 10;
			gameRules['starPos'] = -1;
			gameRules['viewStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewHiScore'] = false;
			gameRules['viewScore'] = true;
			gameRules['viewBestTime'] = true;
			gameRules['viewTime'] = true;
			gameRules['viewMaxChain'] = false;
			gameRules['recordIs'] = 'time';
		break;
		case 'practice': 
			gameRules['createDiceDuration'] = -1;
			gameRules['createDiceByShift'] = true;
			gameRules['createDiceTop2'] = false;
			gameRules['allDeleteIsClear'] = false;
			gameRules['limitTime'] = 0;
			gameRules['startDiceNum'] = 6;
			gameRules['starPos'] = -1;
			gameRules['viewStatus'] = false;
			gameRules['viewViewContorol'] = false;
			gameRules['viewHiScore'] = true;
			gameRules['viewScore'] = true;
			gameRules['viewBestTime'] = false;
			gameRules['viewTime'] = true;
			gameRules['viewMaxChain'] = true;
			gameRules['recordIs'] = false;
		break;
	}
	// ゲームの初期化
	setGameInitByRules();
	// ループの設置
}
// ゲームルールに沿ってゲームの初期化
function setGameInitByRules( RETRY = false ) {
	console.log('setGameInitByRules');
	// タイマーのクリア
	clearInterval(newDiceINTERVAL_id);
	// 得点の初期化
	scoreOBJ.usrScore = 0;
	scoreOBJ.viewScore = 0;
	// deleteLogの初期化
	diceHelper.deleteLog = [];
	// pauseフラグ
	isPause = false;
	//
	// 得点表示の初期化
	const scoreView = document.body.querySelector('.scoreView .gameText');
	//scoreView.textContent = String(viewScore).padStart(10,0);
	scoreOBJ.updataView( scoreOBJ.viewScore, scoreOBJ.scoreElmt );
	// 表示の設定
	gameViewByRules();
	document.body.querySelector('.screenWrap').classList.remove('st-DEAD');
	document.body.querySelector('.currentViewWrap').classList.remove('st-DEAD');
	// diceの初期配置
	if(RETRY && 
		(selectedGameMode === 1 || selectedGameMode === 2 || selectedGameMode === 3) ) {
		loadDicePosByBackup(); // バックアップから読み込み
	}
	else {
		setStartDiceByRules(); // 新規配置&配置をバックアップする
	}
	// focusのスタート位置
	setFocusPosByRules();
	// ゲームの挙動に関する設定
	// diceの自動生成
	const autoCreateDiceBox5s = document.body.querySelector('#autoCreateDiceBox5s');
	const autoCreateDiceBox10s = document.body.querySelector('#autoCreateDiceBox10s');
	autoCreateDiceBox5s.checked = false;
	autoCreateDiceBox10s.checked = false;
	if( gameRules['createDiceDuration'] === 5*1000 ) {
		autoCreateDiceBox5s.checked = true;
	}
	else if( gameRules['createDiceDuration'] === 10*1000 ) {
		autoCreateDiceBox10s.checked = true;
	}
	// ゲーム開始時に設定時間が-1でなければ、newDiceINTERVAL_id = setInterval( diceHelper.addNewDiceOnGame, gameRules['createDiceDuration'] );
	// shiftでdice生成
	const createDiceByShiftBox = document.body.querySelector('#createDiceByShiftBox');
	createDiceByShiftBox.checked = gameRules['createDiceByShift'];
	createDiceByShiftIs = gameRules['createDiceByShift'];
	// 生成diceの天面を2にする設定
	const create2DiceBox = document.body.querySelector('#create2DiceBox');
	create2DiceBox.checked = gameRules['createDiceTop2'];
	create2DiceIs = gameRules['createDiceTop2'];
	// limitTimeの設定
	// gameRules['limitTime'] = 0:カウントアップ,-1:時間設定なし,0以上ならカウントダウン
	timerOBJ.viewUpdata({
		min : 0,
		sec : 0,
		ms : 0,
	});
	timerOBJ.timeLimit = gameRules['limitTime'];
	if( gameRules['limitTime'] > 0 ) {
		const LIMIT = gameRules['limitTime'];
		const min = String(Math.floor(gameRules['limitTime']/(60*1000))).padStart(2,0);
		const sec = String(Math.floor(gameRules['limitTime']/1000)%60).padStart(2,0);
		const ms = String(gameRules['limitTime']%1000).padStart(3,0);
		//console.log('limit:::', min, sec, ms);
		timerOBJ.viewUpdata({
			min : min,
			sec : sec,
			ms : ms,
		});
	}
	//
	// ゲーム開始表示
	gamingViewFunc();
	// gamestart 表示
	document.body.querySelector('.gamestartView').classList.add('open');
	//
	// ゲーム開始用にcontrolを合わせておく
	if(configOBJ.canChangeControlAxis) { dragControlOBJ.delta = 45; }
	else { dragControlOBJ.delta = 0; }
	document.body.querySelector('.controlbtnWrap').style['transform'] = `rotate(${dragControlOBJ.delta}deg)`;
	//
	// ゲームスタート待ち
	window.addEventListener('gameStart',function (evt) {
		console.log('gamestart');
		//console.log(evt.key);
		if( gameRules['limitTime'] >= 0 ) {
			//console.log('timerCheck');
			timerOBJ.start(); // タイマースタート
		}
		if( gameRules['createDiceDuration'] > 0 ) {
			//console.log(gameRules['createDiceDuration']);
			newDiceINTERVAL_id = setInterval( diceHelper.addNewDiceOnGame, gameRules['createDiceDuration'] ); // dice自動生成タイマーのスタート
		}
		// pauseボタンの表示
		document.body.querySelector('#pauseBtn').style['display'] = null;
		// gamestart 非表示
		document.body.querySelector('.gamestartView').classList.add('close');
		const outDuration = 1000;
		setTimeout(function() {
			document.body.querySelector('.gamestartView').classList.remove('open','close');
		}, outDuration);
		// ゲーム監視ループ
		//clearInterval(onGameLoop_id); // 念の為 timerを初期化 <-openingで処理すれば不要のはず
		onGameLoop_id = setInterval(onGameLoop, 1*FRM);
	}, {once: true});
}
function gameViewByRules() {
	console.log('gameViewByRules');
	// 状態ウィンドウ
	const debugView = document.body.querySelector('.debugView');
	if(gameRules['viewStatus']) {
		debugView.classList.add('open');
	}
	else { debugView.classList.remove('open'); }
	// 表示操作類
	const viewControlsView = document.body.querySelector('.viewControlsView');
	if(gameRules['viewViewContorol']) {
		viewControlsView.classList.add('open');
	}
	else { viewControlsView.classList.remove('open'); }
	//
	// scoresWrapの表示更新
	scoresWrapViewOBJ.hiScoreViewIs = gameRules['viewHiScore'];
	scoresWrapViewOBJ.scoreViewIs = gameRules['viewScore'];
	scoresWrapViewOBJ.bestTimeViewIs = gameRules['viewBestTime'];
	scoresWrapViewOBJ.timeViewIs = gameRules['viewTime'];
	scoresWrapViewOBJ.maxChainViewIs = gameRules['viewMaxChain'];
	scoresWrapViewOBJ.updataView();
}
//
function setStartDiceByRules() {
	// ステージのリセット
	stageOBJ.reset();
	//
	if( gameRules['startDiceNum'] <= 0 ) { return; }
	//
	while( diceHelper.list.length < gameRules['startDiceNum'] ) {
		const tmpDice = new Dice();
		diceHelper.list.push( tmpDice );
		tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
		tmpDice.randomSetFace();
	}
	//
	// ランダム配置
	for(const dice of diceHelper.list) {
		stageOBJ.updata(); // stageOBJ.mapの更新
		let selectedPos = stageOBJ.getEmptyPosAtRandom();
		let count = 0;
		while( !selectedPos ) {
			count++;
			if( count>stageOBJ.map.length * stageOBJ.map[0].length ) {
				console.log('候補地エラー');
				break;
			}
			selectedPos = stageOBJ.getEmptyPosAtRandom();
		}
		if( !selectedPos ) { break; } // 生成せずにループを抜ける
		dice.setPos(selectedPos[0], selectedPos[1]);
		stageOBJ.updata(); // stageOBJ.mapの更新
		//
	}
	// バックアップ
	diceHelper.backupDices( diceHelper.list );
	//
}
function loadDicePosByBackup() {
	// ステージのリセット
	stageOBJ.reset();
	// dice配置をbackupから読み込み
	for( let i=0; i<diceHelper.backupList.length; i++ ) {
		const tmpDice = new Dice();
		diceHelper.list[i] =  tmpDice;
		tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
		tmpDice.setFace(
			diceHelper.backupList[i]['topNum'],
			diceHelper.backupList[i]['rightNum'],
			diceHelper.backupList[i]['downNum'],
		);
		tmpDice.setPos( diceHelper.backupList[i]['posX'], diceHelper.backupList[i]['posY'] );
	}
	stageOBJ.updata(); // stageMapの更新
}
function setFocusPosByRules() {
	let posX = 0;
	let posY = 0;
	if(gameRules['starPos'] === -1){
		diceHelper.players = diceHelper.list[0];
		focusOBJ.setDir( focusOBJ.currentDir = 135 );
		posX = diceHelper.players.posX;
		posY = diceHelper.players.posY;
	}
	else {
		diceHelper.players = floorDice;
		posX = gameRules['starPos'][0];
		posY = gameRules['starPos'][1];
	}
	focusOBJ.setPos(posX, posY);
	// 足元チェック
	//const footDice = diceHelper.getDiceByPosition(focusOBJ.posX,focusOBJ.posY);
	focusOBJ.footCheck();
}
// ゲームクリア判定
function judgeGameClearByRules() { // ゲームクリアならtrueを返す
	//console.log('judgeGameClearByRules:::',gameRules['allDeleteIsClear']);
	let flg = false;
	// クリア条件:全消し
	if( gameRules['allDeleteIsClear'] ) {
		//console.log('check:allDeleteIsClear');
		flg = true;
		// ステージ上が全て0 or -値
		for(let i=0; i<stageOBJ.map.length; i++){
			for(let j=0; j<stageOBJ.map[i].length; j++){
				if( stageOBJ.map[i][j] > 0 ) { flg = false; break;} // 生きたdice発見
			}
			if(!flg) { break; } // 生きたdiceが見つかっていれば、ループを抜ける
		}
	}
	//
	return flg;
}
// ゲームオーバー判定
function judgeGameOverByRules() { // ゲームオーバーならtrueを返す
	let flg = false;
	// タイムアップ
	if( timerOBJ.timeUpIs ) { return true; }
	//
	// 床が埋まっている
	// ステージ上が全てがdice(+値)
	flg = true;
	let livingDiceCount = 0;
	let livingDiceTopFaces =[0,0,0,0,0,0];
	for(let i=0; i<stageOBJ.map.length; i++){
		for(let j=0; j<stageOBJ.map[i].length; j++){
			if( stageOBJ.map[i][j] <= 0 ) {
				flg = false; // 空白 or DLETE
			}
			else {
				livingDiceCount++; // 生きたdiceのカウント
				livingDiceTopFaces[stageOBJ.map[i][j]-1] += 1; // topFaceが同じものをカウント
			}
		}
	}
	//
	if(flg) { return flg; }
	//
	/* クリア不能条件
	if(gameRules['createDiceDuration'] === -1 && !gameRules['createDiceByShift']) { // 追加diceの設定が無い状態
		// diceが1つになってしまった。DELETEが無い状態で
		if(livingDiceCount === 1) { return true; }
		// 床に落ちてしまった。
		if(focusOBJ.height === 0) {
			console.log('onFloorCheck:::',livingDiceTopFaces);
			// diceの天面の数が合わない場合
			flg = true;
			for(let i=1; i<livingDiceTopFaces.length; i++) {
				if( i+1 < livingDiceTopFaces[i] ) {
					flg = false;
					break; // 消せる可能性がるので、ループを抜ける
				}
			}
			if(flg) { return flg; }
		}
	}
	*/
	return false;
}
// ゲームpause処理
function pauseMenuFunc() {
	// 各タイマーはpauseBtnで止まっている
	// TIME のアニメ除去
	if( timerOBJ.elmt.classList.contains('LIMITani') ) {
		timerOBJ.elmt.classList.remove('LIMITani');
		timerOBJ.elmt.classList.add('LIMIT');
	}
	// 得点の加算が終わっていない場合
	// scoreの更新が残っていたら最後まで対応させる (LOOP=trueで独立して完了まで処理)
	//scoreOBJ.updata( true ); //<-- 一旦スルー
	//
	// pauseボタンの非表示
	//document.body.querySelector('#pauseBtn').style['display'] = 'none';
	// 表示設定
	//gameoverViewFunc();
	document.body.querySelector('.screenWrap').classList.add('st-DEAD');
	document.body.querySelector('.currentViewWrap').classList.add('st-DEAD');
	//
	// メッセージ表示
	const gameoverView = document.body.querySelector('.gameoverView');
	const MES = 'PAUSE';
	gameoverView.querySelector('.viewText').textContent = MES;
	//
	setTimeout(function() {
		gameoverView.classList.add('open', 'pause');
		gameSelectorOBJ.init(pauseMenuLIST, -1);
		//
	}, 1*FRM);
}
// ゲーム終了処理
function gameEndFunc(clear, over, MES = '') {
	console.log('gameEndFunc');
	// 各タイマーのストップ
	timerOBJ.stop();
	timerOBJ.timeUpIs = false;
	//console.log('timeup:::',timerOBJ.timeUpIs);
	clearInterval( newDiceINTERVAL_id );
	clearInterval( onGameLoop_id );
	// TIME のアニメ除去
	if( timerOBJ.elmt.classList.contains('LIMITani') ) {
		timerOBJ.elmt.classList.remove('LIMITani');
		timerOBJ.elmt.classList.add('LIMIT');
	}
	dragControlOBJ.delta = 0;
	document.body.querySelector('.controlbtnWrap').style['transform'] = `rotate(${dragControlOBJ.delta}deg)`;
	//
	// 得点の加算が終わっていない場合
	// scoreの更新が残っていたら最後まで対応させる (LOOP=trueで独立して完了まで処理)
	scoreOBJ.updata( true );
	//
	// pauseボタンの非表示
	document.body.querySelector('#pauseBtn').style['display'] = 'none'; //<=不要
	//
	// 表示設定
	gameoverViewFunc();
	document.body.querySelector('.screenWrap').classList.add('st-DEAD');
	document.body.querySelector('.currentViewWrap').classList.add('st-DEAD');
	//
	// メッセージ表示
	const gameoverView = document.body.querySelector('.gameoverView');
	if(MES === '') {
		if(clear) { MES = 'Clear!!'; }
		else { MES = 'GAME OVER'; }
	}
	setTimeout( function() {
		gameoverView.querySelector('.viewText').textContent = MES;
	}, 500);
	// メニュー
	// ranking可能状態の指定
	document.body.querySelector('#rankingBtn').disabled = true;
	if( clear || // ゲームクリア時
		(over && selectedGameMode === 1) || // TimeTrial2minをやり切った
		selectedGameMode === 2 // Servivalモードはギブアップでも
		) {
		document.body.querySelector('#rankingBtn').disabled = false;
	}
	// ハイスコアの一時保存
	// hi scoreは全て格納
	if( userScoreLIST[selectedGameMode] < scoreOBJ.usrScore ) {
		userScoreLIST[selectedGameMode] = scoreOBJ.usrScore;
	}
	// ゲームプレイ時間は…
	if(
		(clear && selectedGameMode === 3) && (userTimeLIST[selectedGameMode] > timerOBJ.stopTime ) || // dice10Challengeを短い時間でやり切った
		(selectedGameMode === 0) && (userTimeLIST[selectedGameMode] < timerOBJ.stopTime ) || // 時間制限でないものはとりあえず長時間のものを格納
		(selectedGameMode === 2) && (userTimeLIST[selectedGameMode] < timerOBJ.stopTime ) ||
		(selectedGameMode === 4) && (userTimeLIST[selectedGameMode] < timerOBJ.stopTime ) 
	) {
		userTimeLIST[selectedGameMode] = timerOBJ.stopTime;
		if( bestTime > timerOBJ.stopTime ) {
			bestTime = timerOBJ.stopTime;
		}
	}
	//
	setTimeout(function() {
		gameoverView.classList.add('open');
		gameSelectorOBJ.init(gameoverSelectLIST, -1);
		// scoresWrapの表示更新
		scoresWrapViewOBJ.hiScoreViewIs = true;
		scoresWrapViewOBJ.scoreViewIs = true;
		scoresWrapViewOBJ.bestTimeViewIs = selectedGameMode === 1 ? false : true;
		scoresWrapViewOBJ.timeViewIs = true;
		scoresWrapViewOBJ.maxChainViewIs = true;
		scoresWrapViewOBJ.updataView();
		//
		timerOBJ.viewUpdataAtBest( timerOBJ.setFormat(bestTime) );
	}, 800);
}
//
//onGameLoop_id = setInterval(onGameLoop, 1*FRM);
//
// ゲームループ
function onGameLoop() {
	//console.log('onGameLoop');
	// 操作座標系
	if( isPause || !configOBJ.canChangeControlAxis ) {
		//console.log(isPause, configOBJ.canChangeControlAxis);
		dragControlOBJ.delta = 0;
	}
	else {
		dragControlOBJ.delta = 45;
	}
	document.body.querySelector('.controlbtnWrap').style['transform'] = `rotate(${dragControlOBJ.delta}deg)`;
	//
	stageOBJ.updata(); // Mapの更新
	// 動作要求のチェック
	if( focusOBJ.requestDir !== '' ) { // 要求があれば...
		//console.log( 'onGameLoop:::', focusOBJ.requestDir );
		controlCheck( focusOBJ.requestDir );
	}
	focusOBJ.requestDir = ''; // 要求を空に
	//
	// pause機能の導入
	//
	// 足元のチェック
	focusOBJ.footCheck();
	//
	// ステータス確認用情報入力　for Debug
	focusStatus_global = `POS(${focusOBJ.posX},${focusOBJ.posY}), H:${Math.floor(focusOBJ.height)}, D:${Math.floor(focusOBJ.currentDir)}`;
	// 足元の情報
	const footDice = diceHelper.getDiceByPosition(focusOBJ.posX, focusOBJ.posY);
	if(footDice != false) {
		const footTopface = footDice.getTopFace();
		const footLife = footDice.deleteLife;
		const footHeight = Math.floor(footDice.height);
		const footClass = footDice.element.classList;
		footStatus_global = `T:${footTopface},L:${footLife},H:${footHeight}<br>footClass::${footClass}`;
	}
	else {
		footStatus_global = `ゆか`;
	}
	forDebugOBJ.viewVal(); // debug表示
	//
	// 得点更新
	scoreOBJ.updata();
	// 
	// chain 更新
	maxChainOBJ.updata(maxChainList);
	//
	// 終了判定
	//console.log( 'canDiceMove:::',diceHelper.canDiceMove  );
	//console.log(diceHelper.players.surface.Top.face,diceHelper.players.surface.Top.nextFace);
	// 足元のdiceが動いている時は、判定をしなければいい？ <= 移動終わりの判定ではうまくいかない？
	if( !diceHelper.canDiceMove ||
		Math.abs(diceHelper.players.surface.Top.face) !== Math.abs(diceHelper.players.surface.Top.nextFace) ) { return; }
	// 終了判定
	const gameClearIs = judgeGameClearByRules();
	const gameOverIs = judgeGameOverByRules();
	if(gameClearIs) {
		console.log('game clear');
	}
	if(gameOverIs) {
		console.log('game over');
	}
	// 終了処理
	if( gameClearIs || gameOverIs ) {
		gameEndFunc(gameClearIs, gameOverIs);
	}
}
// 
// 以上 ゲームルール関係
//
// infomation
const gameInfomationWrap = document.body.querySelector('.gameInfomationWrap');
gameInfomationWrap.addEventListener('click', infomationClickHandler, { once : true });
function infomationClickHandler(evt) {
	gameInfomationWrap.removeEventListener('click', infomationClickHandler, { once : true });
	gameInfomationWrap.classList.add('close');
	const duration = 600;
	gameInfomationWrap.style['transition-duration'] = duration + 'ms';
	gameInfomationWrap.querySelector('.gameInfomationTxtWrap').style['transition-duration'] = duration + 'ms';
	setTimeout(function() {
		gameInfomationWrap.classList.remove('open', 'close');
	 },duration);
}
//
// ゲーム設定
let autoCreateDiceIs = false; // 自動生成フラグ
const autoCreateDiceBox5s = document.body.querySelector('#autoCreateDiceBox5s');
const autoCreateDiceBox10s = document.body.querySelector('#autoCreateDiceBox10s');
autoCreateDiceBox5s.addEventListener('change', function(evt) {
	clearInterval(newDiceINTERVAL_id); // 自動生成タイマーのクリア
	if(autoCreateDiceBox10s.checked) { autoCreateDiceBox10s.checked = false; }
	// dice追加タイマーのスタート
	if( autoCreateDiceIs = evt.target.checked ) {
		newDiceINTERVAL_id = setInterval( diceHelper.addNewDiceOnGame, 5*1000 );
	}
});
autoCreateDiceBox10s.addEventListener('change', function(evt) {
	clearInterval(newDiceINTERVAL_id); // 自動生成タイマーのクリア
	if(autoCreateDiceBox5s.checked) { autoCreateDiceBox5s.checked = false; }
	// dice追加タイマーのスタート
	if( autoCreateDiceIs = evt.target.checked ) {
		newDiceINTERVAL_id = setInterval( diceHelper.addNewDiceOnGame, 10*1000 );
	}
});
let create2DiceIs = false; // 生成diceの天面面を2にするフラグ
const create2DiceBox = document.body.querySelector('#create2DiceBox');
create2DiceBox.addEventListener('change', function(evt) {
	create2DiceIs = !create2DiceIs;
});
let createDiceByShiftIs = false; // Shiftの押下でdiceを生成できるフラグ
const createDiceByShiftBox = document.body.querySelector('#createDiceByShiftBox');
createDiceByShiftBox.addEventListener('change', function(evt) {
	createDiceByShiftIs = !createDiceByShiftIs;
});
//
/******* ボタン類 *******/
// ゲームスタートボタン
const gameStartBTN = document.body.querySelector('#gameStartBtn');
gameStartBTN.addEventListener('click',gameStartBtnClick);
function gameStartBtnClick(evt) {
	// gameModeの選択状態のクリア
	for(let i=0; i<gameModeLIST.length; i++) {
		const BTN = document.body.querySelector(`#${gameModeLIST[i]}`);
		BTN.classList.remove('selected');
		const INFO = document.body.querySelector(`.gameModeInfo.${gameModeLIST[i]}`);
		INFO.classList.remove('open');
	}
	// gameModeウィンドウのclose
	//document.body.querySelector('.gameSelectView').style['display'] = 'none';
	document.body.querySelector('.gameSelectView').classList.remove('open');
	document.body.querySelector('.gameModeInfoView').style['display'] = 'none';
	// ゲームスタート処理へ
	gameStartFunc(selectedGameMode);
}
// pause処理
const pauseBTN = document.body.querySelector('#pauseBtn');
pauseBTN.addEventListener('click', pauseFunc);
function pauseFunc() {
	// pause中は、各timer処理をスルーする様にすればいいのでは?
	isPause = !isPause;
	//console.log('isPause:::',isPause);
	// dice
	for(const tmpDice of diceHelper.list) {
		//console.log(tmpDice);
		tmpDice.element.classList.remove('PAUSE');
		if(isPause) { tmpDice.element.classList.add('PAUSE'); }
	}
	// timer
	if( isPause ) { timerOBJ.pause(); }
	else { timerOBJ.resume(); }
	//
	// menu
	if( isPause ) {
		pauseMenuFunc();
	}
	else {
		resumeFunc();
	}
}
// ゲームオーバー時のボタン
// resume
const resumeBTN = document.body.querySelector('#resumeBtn');
resumeBTN.addEventListener('click', resumeFunc);
function resumeFunc(evt) {
	isPause = false;
	// dice
	for(const tmpDice of diceHelper.list) {
		//console.log(tmpDice);
		tmpDice.element.classList.remove('PAUSE');
	}
	// timer resume
	timerOBJ.resume();
	//
	//document.body.querySelector('.gameoverView').classList.remove('open', 'pause');
	document.body.querySelector('.gameoverView').classList.add('close');
	setTimeout(function() {
		document.body.querySelector('.gameoverView').classList.remove('open', 'pause', 'close');
	},600);
	document.body.querySelector('.screenWrap').classList.remove('st-DEAD');
	document.body.querySelector('.currentViewWrap').classList.remove('st-DEAD');
}
// give upボタン
const giveupBTN = document.body.querySelector('#giveupBtn');
giveupBTN.addEventListener('click', giveupFunc);
function giveupFunc(evt) {
	// ゲームオーバー表示の片付け
	const gameoverView = document.body.querySelector('.gameoverView');
	document.body.querySelector('.gameoverView').classList.add('close');
	setTimeout(function() {
		document.body.querySelector('.gameoverView').classList.remove('open', 'pause', 'close');
	},600);
	// ギブアップ処理 <-give upは、pauseから来ているので、resumeして改めてstop
	timerOBJ.resume();
	timerOBJ.stop();
	// 強制ゲームオーバー設定
	gameEndFunc(false, false, 'GIVE UP');
}
// リトライ
const retryBTN = document.body.querySelector('#retryBtn');
retryBTN.addEventListener('click', retryFunc);
function retryFunc(evt) {
	// タイマーのクリア
	clearInterval(newDiceINTERVAL_id);
	// ステージのリセット
	stageOBJ.reset();
	//
	// 配置があるゲームモードの場合は、
	// diceHelper.backupListから情報を読み出して設定
	setGameInitByRules(true); // trueでバックアップから起動
	//
	// ゲームオーバー表示の片付け
	const gameoverView = document.body.querySelector('.gameoverView');
	gameoverView.classList.remove('open');
}
// ランキング
const rankingBTN = document.body.querySelector('#rankingBtn');
rankingBTN.addEventListener('click', rankingFunc);
function rankingFunc(evt) { 
	console.log('rankingFunc:::', timerOBJ.stopTime);
	// ランキングのための処理
	const sendGameMode = gameModeLIST[selectedGameMode];
	let tmpTime = 0;
	switch( gameModeLIST[selectedGameMode] ) {
		case 'TimeTrial2min': 
		if( timerOBJ.stopTime > gameRules['limitTime']) {
			tmpTime = gameRules['limitTime'];
		}
		else {
			tmpTime = timerOBJ.stopTime;
		}
		break;
		case 'Servival': 
		case 'dice10Challenge': 
		tmpTime = timerOBJ.stopTime;
		break;
	}
	const sendScore = scoreOBJ.usrScore;
	const sendTime = tmpTime;
	// 結果の表示
	document.body.querySelector('.resultView').classList.add('open');
	// スコアの流し込み
	document.body.querySelector('.resultView .resultGameMode .userVal').textContent = sendGameMode;
	document.body.querySelector('.resultView .resultTime .userVal').textContent = timerOBJ.viewFormat(sendTime);
	document.body.querySelector('.resultView .resultScore .userVal').textContent = sendScore;
	// ハイスコア更新表示
	document.body.querySelector('.resultScore .hiScoreUpdata').classList.remove('visible');
	if(sendScore >= scoreOBJ.hiScore) {
		document.body.querySelector('.resultScore .hiScoreUpdata').classList.add('visible');
	}
	// ベストタイム更新表示
	document.body.querySelector('.resultTime .bestTimeUpdata').classList.remove('visible');
	if(sendTime <= bestTime && (selectedGameMode === 3 ))  {
		document.body.querySelector('.resultTime .bestTimeUpdata').classList.add('visible');
	}
	// ゲームオーバー表示を非表示
	const gameoverView = document.body.querySelector('.gameoverView');
	gameoverView.classList.remove('open');
	//
	// yes or no
	document.body.querySelector('.resultView .gamebtn.yes').addEventListener('click',function(evt){
		// ランキングを開いておく
		const rankingViewWrap = document.body.querySelector('.rankingViewWrap');
		rankingViewWrap.classList.remove('shrink');
		// submitの実行
		submitRankingFunc(sendGameMode, sendTime, sendScore, gameRules['recordIs'], true);
		// 結果の非表示
		document.body.querySelector('.resultView').classList.remove('open');
		// gameoverViewの表示
		gameoverView.classList.add('open');
		gameSelectorOBJ.init(gameoverSelectLIST, -1);
		//gameSelectorOBJ.pos = -1;
		// rankingを非対応にする
		document.body.querySelector('#rankingBtn').disabled = true;
		// ハイスコア更新非表示
		document.body.querySelector('.resultScore .hiScoreUpdata').classList.remove('visible');
		// ベストタイム更新非表示
		document.body.querySelector('.resultTime .bestTimeUpdata').classList.remove('visible');
	});
	document.body.querySelector('.resultView .gamebtn.no').addEventListener('click', function(evt) {
		// submitのキャンセル
		gameoverView.classList.add('open');
		gameSelectorOBJ.init(gameoverSelectLIST, -1);
		//gameSelectorOBJ.pos = -1;
		// 結果の非表示
		document.body.querySelector('.resultView').classList.remove('open');
		// ハイスコア更新非表示
		document.body.querySelector('.resultScore .hiScoreUpdata').classList.remove('visible');
		// ベストタイム更新非表示
		document.body.querySelector('.resultTime .bestTimeUpdata').classList.remove('visible');
	});
}
// タイトルへ戻る
const backTitleBTN = document.body.querySelector('#backTitleBtn');
backTitleBTN.addEventListener('click', backTileFunc);
function backTileFunc(evt) {
	// タイトルへ戻す処理
	// ゲームオーバー表示の片付け
	const gameoverView = document.body.querySelector('.gameoverView');
	gameoverView.classList.remove('open');
	// Timeの赤字を治す
	timerOBJ.elmt.classList.remove('LIMIT');
	// scoreを0にする
	scoreOBJ.usrScore = 0;
	scoreOBJ.viewScore = 0;
	// ステージのリセット
	stageOBJ.reset();
	// diceの初期位置
	firstDiceInit();
	diceHelper.players = diceHelper.list[0];
	// focusの更新
	focusOBJ.setDir( focusOBJ.currentDir );
	focusOBJ.setPos( diceHelper.players.posX, diceHelper.players.posY );
	focusOBJ.footCheck();
	//focusFootCheck( diceHelper.players ); 
	// ゲームロード直後表示
	titleViewFunc();
	// メニューの表示処理
	viewGameMenuFunc();
}
//
// 再起動 (テスト)
const rebootBTN = document.body.querySelector('#rebootBtn');
rebootBTN.addEventListener('click', rebootFunc);
function rebootFunc(evt) {
	// 再起動処理
	// タイマーのクリア
	clearInterval(newDiceINTERVAL_id);
	// ステージのリセット
	stageOBJ.reset();
	//
	while( diceHelper.list.length < diceNum ) {
		const tmpDice = new Dice();
		diceHelper.list.push( tmpDice );
		tmpDice.putOnStage( document.body.querySelector('.diceWrap') );
		tmpDice.randomSetFace();
	}
	//
	// ランダム配置
	for(const dice of diceHelper.list) {
		stageOBJ.updata(); // stageOBJ.mapの更新
		let selectedPos = stageOBJ.getEmptyPosAtRandom();
		let count = 0;
		while( !selectedPos ) {
			count++;
			if( count>stageOBJ.map.length * stageOBJ.map[0].length ) {
				console.log('候補地エラー');
				break;
			}
			selectedPos = stageOBJ.getEmptyPosAtRandom();
		}
		if( !selectedPos ) { break; } // 生成せずにループを抜ける
		dice.setPos(selectedPos[0], selectedPos[1]);
		stageOBJ.updata(); // stageOBJ.mapの更新
		//
	}
	// バックアップ
	diceHelper.backupDices( diceHelper.list );
	//
	diceHelper.players = diceHelper.list[0];
	focusOBJ.setDir( focusOBJ.currentDir );
	focusOBJ.setPos( diceHelper.players.posX, diceHelper.players.posY );
	//
	//タイマーの設定
	if(autoCreateDiceBox5s.checked) { // diceの自動生成がONなら
		newDiceINTERVAL_id = setInterval(diceHelper.addNewDiceOnGame, 5*1000);
	}
	if(autoCreateDiceBox10s.checked) { // diceの自動生成がONなら
		newDiceINTERVAL_id = setInterval(diceHelper.addNewDiceOnGame, 10*1000);
	}
}
// リトライ (テスト)
const retryBTN_test = document.body.querySelector('#retryBtn_test');
retryBTN_test.addEventListener('click', retryFunc);
// Dice生成 (テスト)
const addDiceBTN = document.body.querySelector('#addDiceBtn');
addDiceBTN.addEventListener('click', addDiceFunc);
function addDiceFunc(evt) {
	diceHelper.addNewDiceOnGame();
}
// viewBtn (テスト)
let viewRotateX = -30;
const viewUpBTN = document.body.querySelector('#viewUpBtn');
viewUpBTN.addEventListener('click', viewUpFunc);
function viewUpFunc(evt) {
	viewRotateX -= 5;
	stageViewChange();
}
const viewDownBTN = document.body.querySelector('#viewDownBtn');
viewDownBTN.addEventListener('click', viewDownFunc);
function viewDownFunc(evt) {
	viewRotateX += 5;
	stageViewChange();
}
let viewRotateY = -40;
const viewLeftBTN = document.body.querySelector('#viewLeftBtn');
viewLeftBTN.addEventListener('click', viewLeftFunc);
function viewLeftFunc(evt) {
	viewRotateY -= 5;
	stageViewChange();
}
const viewRightBTN = document.body.querySelector('#viewRightBtn');
viewRightBTN.addEventListener('click', viewRightFunc);
function viewRightFunc(evt) {
	viewRotateY += 5;
	stageViewChange();
}
let viewScale = 0.8;
const scaleUpBTN = document.body.querySelector('#scaleUpBtn');
scaleUpBTN.addEventListener('click', scaleUpFunc);
function scaleUpFunc(evt) {
	viewScale += 0.1;
	helperOBJ.setCSS(document.querySelector('.gameScreen'),'--scale',viewScale);
	stageViewChange();
}
const scaleDownBTN = document.body.querySelector('#scaleDownBtn');
scaleDownBTN.addEventListener('click', scaleDownFunc);
function scaleDownFunc(evt) {
	viewScale -= 0.1;
	helperOBJ.setCSS(document.querySelector('.gameScreen'),'--scale',viewScale);
	stageViewChange();
}
// ゲームステージの反映
function stageViewChange() {
	const targetElmt = document.body.querySelector('.gameScreen');
	const duration = 1000;
	const transformTxt = `rotateX(${viewRotateX}deg) rotateY(${viewRotateY}deg) rotateZ(0deg) 
				scaleX(var(--scale)) scaleY(var(--scale)) scaleZ(var(--scale))`;
	targetElmt.style['transform'] = transformTxt;
	targetElmt.style['transition'] = `${duration}ms ease 0s`;
	setTimeout(function(){
		targetElmt.style['transition'] = null;
	}, duration);
}
//
const titleViewBTN = document.body.querySelector('#titleViewBtn');
titleViewBTN.addEventListener('click', gameMenuViewFunc);
// タイトル画面の表示設定
function titleViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -15;
	viewRotateY = -45;
	viewScale = 0.8;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '219px';
	gameScreen.style['top'] = '260px';
	stageViewChange();
}
// ゲームモード選択中の表示設定
function gameMenuViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -5;
	viewRotateY = -45;
	viewScale = 1;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '310px';
	gameScreen.style['top'] = '290px';
	stageViewChange();
}
const gamingViewBTN = document.body.querySelector('#gamingViewBtn');
gamingViewBTN.addEventListener('click', gamingViewFunc);
// ゲーム中の表示設定
function gamingViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -25;
	viewRotateY = -40;
	viewScale = 0.8;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '202px';
	gameScreen.style['top'] = '170px';
	stageViewChange();
}
const gameoverViewBTN = document.body.querySelector('#gameoverViewBtn');
gameoverViewBTN.addEventListener('click', gameoverViewFunc);
// ゲームオーバー時の表示設定
function gameoverViewFunc(evt) {
	const gameScreen = document.querySelector('.gameScreen');
	viewRotateX = -90;
	viewRotateY = -45;
	viewScale = 0.8;
	helperOBJ.setCSS(gameScreen,'--scale',viewScale);
	gameScreen.style['left'] = '219px';
	gameScreen.style['top'] = '-8px';
	stageViewChange();
}
// gameSelectView
const gameSelectView = document.body.querySelector('.gameSelectView');
// gameSelectView.addEventListener('pointermove', dragFunc); // <= drag不要?
const gameModeInfoView = document.body.querySelector('.gameModeInfoView');
// gameModeInfoView.addEventListener('pointermove', dragFunc); // <= drag不要?
// debugView
const debugView = document.body.querySelector('.debugView');
debugView.addEventListener('pointermove', dragFunc);
//
// flash処理(テスト)
const flashBTN = document.body.querySelector('#flashBtn');
flashBTN.addEventListener('click', flashFunc);
function flashFunc() {
	diceHelper.players.addFlash(4*FRM);
}
// 足元のdiceの消し込み処理(テスト)
const deleteBTN = document.body.querySelector('#deleteBtn');
deleteBTN.addEventListener('click', deleteFunc);
function deleteFunc() {
	const dice = diceHelper.getDiceByPosition( focusOBJ.posX, focusOBJ.posY );
	if( dice ) {
		dice.surface['Top']['face'] = -1*( Math.abs(dice.getTopFace()) ); // 消し込みの目印
		diceHelper.delete( dice );
	}
}
// maxChainのクリア(テスト)
const maxChainClearBTN = document.body.querySelector('#maxChainClearBtn');
maxChainClearBTN.addEventListener('click', maxChainClearFunc);
function maxChainClearFunc() {
	maxChainList = [0,0,0,0,0,0];
	maxChainOBJ.updata( maxChainList );
}
//
// 仮コントローラー　リスナー
document.body.querySelector('#ArrowUp').addEventListener('pointerdown', vControlerClick);
document.body.querySelector('#ArrowDown').addEventListener('pointerdown', vControlerClick);
document.body.querySelector('#ArrowLeft').addEventListener('pointerdown', vControlerClick);
document.body.querySelector('#ArrowRight').addEventListener('pointerdown', vControlerClick);
//
function vControlerClick(evt) {
	evt.preventDefault();
	document.querySelector('html').style['overscroll-behavior'] = 'none';
	//window.dispatchEvent(new Event('gameStart')); // ゲームスタート用
	debugView.removeEventListener('pointermove', dragFunc);
	dragControlOBJ.removeDragStartListeners();
	//
	const thisTarget = this;
	window.dispatchEvent( new KeyboardEvent('keydown', { key : thisTarget.id }) );
	thisTarget.classList.add('st-keydown');
	//
	window.addEventListener('pointerup', pointerupHandler);
	thisTarget.addEventListener('pointerleave', pointerupHandler); // touchの時に外すとdown判定が取れないので・・・
	function pointerupHandler(evt){ 
		//clearInterval(timerid);
		document.querySelector('html').style['overscroll-behavior'] = null;
		window.dispatchEvent( new KeyboardEvent('keyup', { key : thisTarget.id }) );
		thisTarget.classList.remove('st-keydown');
		//
		window.removeEventListener('pointerup', pointerupHandler);
		thisTarget.removeEventListener('pointerleave', pointerupHandler);
		debugView.addEventListener('pointermove', dragFunc);
		dragControlOBJ.addDragStartListeners();
	}
}
//
// コントローラーのドラッグ
const dicePreViewWrap = document.body.querySelector('.dicePreViewWrap');
const draggableMarks = document.body.querySelectorAll('.draggableMark');
//draggableMark.addEventListener('pointermove', draggableMarkMove);
for(const draggableMark of draggableMarks) {
	draggableMark.addEventListener('pointerdown', function(evt) {
		evt.preventDefault();
		window.addEventListener('pointermove', draggableMarkMove);
		draggableMark.addEventListener('pointerup', function(evt) {
			window.removeEventListener('pointermove', draggableMarkMove);
		});
	});
}
function draggableMarkMove(evt) {
	if(evt.buttons) {
		//console.log(evt.movementX, evt.movementY);
		dicePreViewWrap.style.left = helperOBJ.getCSS(dicePreViewWrap, 'left') + evt.movementX + 'px';
		dicePreViewWrap.style.top = helperOBJ.getCSS(dicePreViewWrap, 'top') + evt.movementY + 'px';
	}
}
// ステージのドラッグ
const gameScreen = document.body.querySelector('.gameScreen');
gameScreen.addEventListener('pointermove', dragFunc);
//
// ドラッグ処理本体
function dragFunc(evt) {
	if(evt.buttons) {
		evt.preventDefault(); // <- 効いてない?
		document.querySelector('html').style['overscroll-behavior'] = 'none'; // <- 効いてない?
		//
		this.style.left = this.offsetLeft + evt.movementX + 'px';
		this.style.top = this.offsetTop + evt.movementY + 'px';
		this.draggable = false;
		this.setPointerCapture(evt.pointerId);
		//document.body.style['overflow'] = 'hidden';
	}
	window.addEventListener('pointerup', pointerupHandler);
	function pointerupHandler(evet) {
		document.querySelector('html').style['overscroll-behavior'] = null;
	}
}
//
// ランキング
// submit
function submitRankingFunc(gMODE, TIME, SCORE, RECORD, writeFlg) {
	const sendForm = document.querySelector('#sendScore');
	// ゲームモード
	const gameModeInput = document.createElement('input');
	gameModeInput.setAttribute('type', 'hidden');
	gameModeInput.setAttribute('name', 'gMode');
	gameModeInput.value = gMODE;
	sendForm.appendChild(gameModeInput);
	// クリアタイム
	const timeInput = document.createElement('input');
	timeInput.setAttribute('type', 'hidden');
	timeInput.setAttribute('name', 'time');
	timeInput.value = TIME;
	sendForm.appendChild(timeInput);
	// スコア
	const scoreInput = document.createElement('input');
	scoreInput.setAttribute('type', 'hidden');
	scoreInput.setAttribute('name', 'score');
	scoreInput.value = SCORE;
	sendForm.appendChild(scoreInput);
	// 優先記録
	const recordInput = document.createElement('input');
	recordInput.setAttribute('type', 'hidden');
	recordInput.setAttribute('name', 'record');
	recordInput.value = RECORD;
	sendForm.appendChild(recordInput);
	// 書き込みフラグ
	const writeInput = document.createElement('input');
	writeInput.setAttribute('type', 'hidden');
	writeInput.setAttribute('name', 'wrFlg');
	writeInput.value = writeFlg;
	sendForm.appendChild(writeInput);
	//
	document.body.querySelector('iframe.rankingView').focus();
	sendForm.submit(); // データ送信
}
// ドラッグ
const rankingViewWrap = document.body.querySelector('.rankingViewWrap');
rankingViewWrap.addEventListener('pointermove', function(evt){ 
	this.style['transition-duration'] = '0s';
	if(evt.buttons) {
		this.style.left = this.offsetLeft + evt.movementX + 'px';
		this.style.top = this.offsetTop + evt.movementY + 'px';
		this.draggable = false;
		this.setPointerCapture(evt.pointerId);
		//document.body.style['overflow'] = 'hidden';
	}
	window.addEventListener('pointerup', function() { rankingViewWrap.style['transition-duration'] = null; });
});
// shrink
const rankingTitle = document.body.querySelector('.ranking.title');
rankingTitle.addEventListener('click', rankingShrinkFunc);
function rankingShrinkFunc(evt) {
	const shrinkIs = rankingViewWrap.classList.toggle('shrink');
	// 座標の処理
	// open時 W:300 H:300
	// shrink時 W:150 H:30
	const thisX = rankingViewWrap.getBoundingClientRect().left;
	const thisY = rankingViewWrap.getBoundingClientRect().top;
	const thisW = rankingViewWrap.getBoundingClientRect().width;
	const thisH = rankingViewWrap.getBoundingClientRect().height;
	//
	if( shrinkIs ) { // shrinkがついた
		rankingViewWrap.style['left'] = null;
		rankingViewWrap.style['top'] = null;
		/*
		if( thisX > window.innerWidth/4 ) {
			rankingViewWrap.style['left'] = thisX + 150 + 'px';
		}
		if( thisY > window.innerHeight/4 ) {
			rankingViewWrap.style['top'] = thisY + 270 + 'px';
		}
		*/
	}
	else { // shrinkが外れた
		if( thisX - 150 > 0 ) {
			rankingViewWrap.style['left'] = thisX - 150 + 'px';
		}
		if( thisY - 270 > 0 ) {
			rankingViewWrap.style['top'] = thisY - 270 + 'px';
		}
	}
}
//
// ドラッグ操作 設定
dragControlOBJ.init(
	document.body.querySelector('.draggableArea'),
	document.body.querySelector('.controlPoint'),
);
//
// configView
const configViewTitle = document.body.querySelector('.configView .title');
configViewTitle.addEventListener('click', function(evt) {
	document.body.querySelector('.configView').classList.toggle('open');
});
// 操作Pad
const controlPadBox = document.getElementById('checkBoxControlPad');
controlPadBox.addEventListener('change', function(evt) {
	//console.log(this);
	if( this.checked) {
		document.body.querySelector('.controlWrap').classList.add('padMode');
	}
	else {
		document.body.querySelector('.controlWrap').classList.remove('padMode');
	}
});
// 可変操作軸の設定
const controlAxisBox = document.getElementById('checkBoxControlAxis');
controlAxisBox.addEventListener('change', function(evt) {
	//console.log(this, this.checked);
	configOBJ.canChangeControlAxis = this.checked;
	//
});
// debug viewの表示
const debugViewBox = document.getElementById('checkBoxDebugView');
debugViewBox.addEventListener('change', function(evt) {
	//console.log(this, this.checked);
	if( this.checked ) {
		document.body.querySelector('.debugView').classList.add('open');
	}
	else {
		document.body.querySelector('.debugView').classList.remove('open');
	}
	//
});