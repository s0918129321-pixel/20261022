// ==========================================
// 幼兒園趣味生活常識 - 拖曳測驗系統
// ==========================================

// --- 全域變數宣告 ---
let targets = [];       // 上方目標區陣列 (包含題目與動態動畫)
let draggables = [];    // 下方可拖曳選項陣列 (文字卡片)
let activeDraggable = null; // 當前正在拖曳的卡片

let submitBtn;          // 交卷按鈕
let restartBtn;         // 重新開始按鈕

let gameState = 'QUIZ'; // 遊戲狀態：'QUIZ' (測驗中), 'RESULT' (顯示成績)
let score = 0;          // 得分
let confetti = [];      // 彩帶粒子陣列

// 題目資料庫 (6題幼兒園生活常識)
const quizData = [
  { id: 1, text: "睡覺前要刷牙", type: "brush" },
  { id: 2, text: "早上太陽升起", type: "sun" },
  { id: 3, text: "小魚在水裡游", type: "fish" },
  { id: 4, text: "晚上月亮出來", type: "moon" },
  { id: 5, text: "小草需要澆水", type: "plant" },
  { id: 6, text: "快樂地跳舞運動", type: "dance" }
];

// --- p5.js 初始化設定 ---
function setup() {
  // 創建全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 設定文字對齊方式為居中
  textAlign(CENTER, CENTER);

  // 初始化測驗元件 (計算佈局與位置)
  initQuiz();

  // 創建按鈕元件
  createUIButtons();
}

// --- 視窗大小改變時響應重繪 ---
function windowResized() {
  // 調整畫布為新的視窗尺寸
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算卡片與目標區位置
  repositionElements();
}

// --- 初始化/重置測驗資料與位置 ---
function initQuiz() {
  targets = [];
  draggables = [];
  gameState = 'QUIZ';
  score = 0;
  confetti = [];

  // 打亂可拖曳選項的順序 (增加測驗趣味性)
  let shuffledData = [...quizData].sort(() => Math.random() - 0.5);

  // 計算響應式卡片尺寸與間距
  let colCount = 3;
  let rowCount = 2;
  let paddingX = width * 0.05;
  let availableW = width - paddingX * 2;
  
  let targetAreaHeight = height * 0.38;
  let targetW = min(availableW / colCount - 20, 180);
  let targetH = min(targetAreaHeight / rowCount - 15, 110);

  // 1. 建立上方 6 個固定目標區 (按照標準順序 1~6)
  for (let i = 0; i < quizData.length; i++) {
    let col = i % colCount;
    let row = floor(i / colCount);
    
    let x = paddingX + col * (availableW / colCount) + (availableW / colCount) / 2;
    let y = height * 0.12 + row * (targetH + 15) + targetH / 2;

    targets.push({
      id: quizData[i].id,
      text: quizData[i].text,
      type: quizData[i].type,
      x: x,
      y: y,
      w: targetW,
      h: targetH,
      occupiedBy: null // 當前被哪個拖曳卡片佔據
    });
  }

  // 2. 建立下方 6 個可拖曳文字卡片 (打亂順序)
  let dragAreaTop = height * 0.55;
  let dragW = targetW;
  let dragH = min(height * 0.08, 60);

  for (let i = 0; i < shuffledData.length; i++) {
    let col = i % colCount;
    let row = floor(i / colCount);

    let x = paddingX + col * (availableW / colCount) + (availableW / colCount) / 2;
    let y = dragAreaTop + row * (dragH + 20) + dragH / 2;

    draggables.push({
      id: shuffledData[i].id,
      text: shuffledData[i].text,
      homeX: x,        // 原始 X 位置
      homeY: y,        // 原始 Y 位置
      x: x,            // 當前 X 位置
      y: y,            // 當前 Y 位置
      w: dragW,
      h: dragH,
      isDragging: false,
      target: null     // 當前吸附的目標
    });
  }

  // 更新按鈕顯示狀態
  if (submitBtn) submitBtn.hide();
  if (restartBtn) restartBtn.hide();
}

// --- 響應式重新定位卡片 ---
function repositionElements() {
  let colCount = 3;
  let rowCount = 2;
  let paddingX = width * 0.05;
  let availableW = width - paddingX * 2;
  let targetW = min(availableW / colCount - 20, 180);
  let targetH = min(height * 0.38 / rowCount - 15, 110);

  // 重新計算目標區位置
  for (let i = 0; i < targets.length; i++) {
    let col = i % colCount;
    let row = floor(i / colCount);
    targets[i].x = paddingX + col * (availableW / colCount) + (availableW / colCount) / 2;
    targets[i].y = height * 0.12 + row * (targetH + 15) + targetH / 2;
    targets[i].w = targetW;
    targets[i].h = targetH;
  }

  // 重新計算拖曳卡片位置
  let dragAreaTop = height * 0.55;
  let dragW = targetW;
  let dragH = min(height * 0.08, 60);

  for (let i = 0; i < draggables.length; i++) {
    let col = i % colCount;
    let row = floor(i / colCount);
    let hX = paddingX + col * (availableW / colCount) + (availableW / colCount) / 2;
    let hY = dragAreaTop + row * (dragH + 20) + dragH / 2;

    draggables[i].homeX = hX;
    draggables[i].homeY = hY;
    draggables[i].w = dragW;
    draggables[i].h = dragH;

    // 如果沒有吸附目標，回到 Home 位置；否則對齊目標位置
    if (draggables[i].target) {
      draggables[i].x = draggables[i].target.x;
      draggables[i].y = draggables[i].target.y;
    } else {
      draggables[i].x = hX;
      draggables[i].y = hY;
    }
  }

  // 更新按鈕位置
  if (submitBtn) submitBtn.position(width / 2 - 80, height * 0.88);
  if (restartBtn) restartBtn.position(width / 2 - 80, height * 0.82);
}

// --- 建立 DOM UI 按鈕 ---
function createUIButtons() {
  // 建立交卷按鈕
  submitBtn = createButton('交卷看成績 📝');
  submitBtn.size(160, 50);
  submitBtn.style('font-size', '18px');
  submitBtn.style('font-weight', 'bold');
  submitBtn.style('background-color', '#FF6B6B');
  submitBtn.style('color', '#FFFFFF');
  submitBtn.style('border', 'none');
  submitBtn.style('border-radius', '25px');
  submitBtn.style('cursor', 'pointer');
  submitBtn.style('box-shadow', '0px 4px 10px rgba(0,0,0,0.15)');
  submitBtn.position(width / 2 - 80, height * 0.88);
  submitBtn.mousePressed(calculateResult);
  submitBtn.hide(); // 初始隱藏

  // 建立再試一次按鈕
  restartBtn = createButton('再玩一次 🔄');
  restartBtn.size(160, 50);
  restartBtn.style('font-size', '18px');
  restartBtn.style('font-weight', 'bold');
  restartBtn.style('background-color', '#4ECDC4');
  restartBtn.style('color', '#FFFFFF');
  restartBtn.style('border', 'none');
  restartBtn.style('border-radius', '25px');
  restartBtn.style('cursor', 'pointer');
  restartBtn.style('box-shadow', '0px 4px 10px rgba(0,0,0,0.15)');
  restartBtn.position(width / 2 - 80, height * 0.82);
  restartBtn.mousePressed(initQuiz);
  restartBtn.hide();
}

// --- 主繪圖迴圈 ---
function draw() {
  // 繪製溫和可愛的漸層背景色 (柔和天空藍/奶油黃)
  drawBackground();

  if (gameState === 'QUIZ') {
    // --- 繪製測驗畫面 ---
    drawTitle();          // 繪製標題與說明文字
    drawTargets();        // 繪製上方動態目標區
    drawDraggables();     // 繪製下方拖曳文字卡片
    checkAllPlaced();     // 檢查是否全部配對完成以顯示交卷按鈕
  } else if (gameState === 'RESULT') {
    // --- 繪製成績結算畫面 ---
    drawResultScreen();
  }
}

// --- 背景繪製 ---
function drawBackground() {
  background(240, 248, 255); // 柔和天空藍底色
  noStroke();
  fill(255, 250, 230, 180);  // 裝飾性大圓形
  ellipse(width * 0.1, height * 0.1, 300);
  ellipse(width * 0.9, height * 0.85, 400);
}

// --- 標題與說明 ---
function drawTitle() {
  fill(45, 55, 72);
  textSize(min(width * 0.035, 28));
  textStyle(BOLD);
  text("🌟 幼兒園生活常識大挑戰 🌟", width / 2, height * 0.04);

  textSize(min(width * 0.02, 16));
  textStyle(NORMAL);
  fill(100, 116, 139);
  text("請把下方的文字卡片拖曳放到正確的圖案框框裡喔！", width / 2, height * 0.075);
}

// --- 繪製上方 6 個動態目標區 ---
function drawTargets() {
  for (let t of targets) {
    // 繪製卡片圓角外框外觀
    rectMode(CENTER);
    strokeWeight(3);
    if (t.occupiedBy) {
      stroke(72, 187, 120); // 被填入時顯示綠色邊框
      fill(240, 253, 244);
    } else {
      stroke(203, 213, 225); // 預設灰藍色邊框
      fill(255);
    }
    rect(t.x, t.y, t.w, t.h, 15);

    // 繪製對應的動態向量 GIF 風格圖案
    push();
    translate(t.x, t.y - 12);
    drawDynamicAnimation(t.type);
    pop();

    // 標示預留放置區域虛線框提示
    if (!t.occupiedBy) {
      noFill();
      stroke(180, 190, 205);
      strokeWeight(1.5);
      rect(t.x, t.y + t.h * 0.28, t.w * 0.85, t.h * 0.3, 8);
    }
  }
}

// --- 動態向量 GIF 動畫繪製邏輯 ---
function drawDynamicAnimation(type) {
  let t = frameCount * 0.05; // 時間參數控制動畫速率

  switch (type) {
    case 'brush': // 刷牙牙齒動畫
      fill(255); stroke(100); strokeWeight(2);
      rect(0, 0, 36, 30, 8); // 牙齒
      // 刷子的動態搖擺
      let brushX = sin(t * 3) * 12;
      stroke(239, 68, 68); strokeWeight(6);
      line(brushX - 10, -10, brushX + 10, -10); // 刷毛
      stroke(59, 130, 246); strokeWeight(4);
      line(brushX, -10, brushX, 15); // 刷柄
      break;

    case 'sun': // 閃爍旋轉太陽
      stroke(245, 158, 11); strokeWeight(3);
      fill(252, 211, 77);
      push();
      rotate(t * 0.5); // 太陽光芒旋轉
      for (let a = 0; a < 8; a++) {
        rotate(TWO_PI / 8);
        line(0, 0, 22, 0);
      }
      pop();
      circle(0, 0, 28); // 太陽核心
      break;

    case 'fish': // 悠遊小魚
      let fishY = sin(t * 2) * 5;
      translate(0, fishY);
      fill(249, 115, 22); noStroke();
      triangle(-5, 0, -20, -10, -20, 10); // 尾巴
      ellipse(2, 0, 28, 20); // 魚身
      fill(255); circle(8, -3, 6); // 眼睛
      fill(0); circle(9, -3, 2);
      break;

    case 'moon': // 搖籃夜晚月亮與星星
      fill(251, 191, 36); noStroke();
      arc(0, 0, 30, 30, HALF_PI, TWO_PI - HALF_PI); // 彎月
      // 閃爍小星星
      let starAlpha = map(sin(t * 4), -1, 1, 50, 255);
      fill(245, 158, 11, starAlpha);
      circle(12, -10, 6);
      circle(-12, 10, 4);
      break;

    case 'plant': // 微風吹拂長大的小草
      stroke(34, 197, 94); strokeWeight(4);
      noFill();
      let sway = sin(t * 2) * 6;
      line(0, 15, sway, -5); // 莖
      fill(74, 222, 128); noStroke();
      ellipse(sway - 6, -5, 12, 6); // 左葉
      ellipse(sway + 6, -8, 12, 6); // 右葉
      break;

    case 'dance': // 快樂跳躍的人形/動物
      let jumpY = abs(sin(t * 3)) * -10;
      translate(0, jumpY);
      fill(236, 72, 153); noStroke();
      circle(0, -12, 16); // 頭部
      stroke(236, 72, 153); strokeWeight(4);
      line(0, -4, 0, 10); // 身體
      // 手舞足蹈
      line(0, -2, -12, -10 + sin(t * 5) * 5);
      line(0, -2, 12, -10 - sin(t * 5) * 5);
      break;
  }
}

// --- 繪製下方 6 個可拖曳卡片 ---
function drawDraggables() {
  for (let d of draggables) {
    push();
    translate(d.x, d.y);

    // 拖曳中的卡片有懸浮放大的陰影效果
    if (d.isDragging) {
      fill(0, 0, 0, 30);
      rect(4, 4, d.w, d.h, 12);
      scale(1.05); // 放大效果
    }

    // 卡片背景
    rectMode(CENTER);
    strokeWeight(2);
    if (d.target) {
      stroke(99, 102, 241); // 吸附後的邊框顏色
      fill(238, 242, 255);
    } else {
      stroke(148, 163, 184); // 預設卡片邊框
      fill(255);
    }
    rect(0, 0, d.w, d.h, 12);

    // 卡片文字內容
    fill(30, 41, 59);
    noStroke();
    textSize(min(d.w * 0.12, 16));
    textStyle(BOLD);
    text(d.text, 0, 0);

    pop();
  }
}

// --- 滑鼠點擊事件 (開始拖曳) ---
function mousePressed() {
  if (gameState !== 'QUIZ') return;

  // 從最上層向後檢查點擊到的卡片
  for (let i = draggables.length - 1; i >= 0; i--) {
    let d = draggables[i];
    // 判斷滑鼠是否落在卡片範圍內
    if (mouseX > d.x - d.w / 2 && mouseX < d.x + d.w / 2 &&
        mouseY > d.y - d.h / 2 && mouseY < d.y + d.h / 2) {
      
      d.isDragging = true;
      activeDraggable = d;

      // 若原先已吸附至目標區，釋放該目標區
      if (d.target) {
        d.target.occupiedBy = null;
        d.target = null;
      }
      break;
    }
  }
}

// --- 滑鼠拖曳中事件 ---
function mouseDragged() {
  if (activeDraggable) {
    // 讓卡片跟隨滑鼠移動
    activeDraggable.x = mouseX;
    activeDraggable.y = mouseY;
  }
}

// --- 滑鼠放開事件 (磁吸與放置邏輯) ---
function mouseReleased() {
  if (activeDraggable) {
    let d = activeDraggable;
    let snapped = false;

    // 檢查是否拖曳至任何一個目標區附近
    for (let t of targets) {
      // 計算卡片與目標區中心點距離
      let distToTarget = dist(d.x, d.y, t.x, t.y);

      // 當距離小於磁吸臨界值且目標區未被佔據
      if (distToTarget < t.w * 0.6 && !t.occupiedBy) {
        // 觸發磁吸：將卡片中心直接對齊目標區
        d.x = t.x;
        d.y = t.y;
        d.target = t;
        t.occupiedBy = d;
        snapped = true;
        break;
      }
    }

    // 若未成功吸附至目標區，彈回原始位置 (Home Position)
    if (!snapped) {
      d.x = d.homeX;
      d.y = d.homeY;
      d.target = null;
    }

    d.isDragging = false;
    activeDraggable = null;
  }
}

// --- 檢查是否全部完成放置 ---
function checkAllPlaced() {
  let allPlaced = draggables.every(d => d.target !== null);
  if (allPlaced) {
    submitBtn.show(); // 顯示「交卷看成績」按鈕
  } else {
    submitBtn.hide();
  }
}

// --- 計算成果與分數 ---
function calculateResult() {
  gameState = 'RESULT';
  submitBtn.hide();

  let correctCount = 0;
  // 比對每個目標區與佔據卡片的 ID 是否完全符合
  for (let t of targets) {
    if (t.occupiedBy && t.occupiedBy.id === t.id) {
      correctCount++;
    }
  }

  // 計算百分比分數 (答對每一題得 16.6 分，全對 100 分)
  score = round((correctCount / quizData.length) * 100);

  // 當成績高於 80% 時，觸發繽紛彩帶慶祝效果
  if (score >= 80) {
    createConfettiSystem();
  }

  restartBtn.show(); // 顯示重新開始按鈕
}

// --- 繪製成績結算面板 ---
function drawResultScreen() {
  // 半透明白底背景
  fill(255, 255, 255, 230);
  rectMode(CENTER);
  stroke(226, 232, 240);
  strokeWeight(2);
  rect(width / 2, height / 2, min(width * 0.85, 500), height * 0.7, 20);

  // 繪製得分數字
  noStroke();
  fill(45, 55, 72);
  textSize(min(width * 0.04, 32));
  textStyle(BOLD);
  text("測驗結果", width / 2, height * 0.22);

  // 根據得分改變數字顏色
  if (score >= 80) fill(34, 197, 94);  // 綠色 (優良)
  else fill(239, 68, 68);             // 紅色 (需努力)

  textSize(min(width * 0.08, 64));
  text(score + " 分", width / 2, height * 0.33);

  // 評語與鼓勵文字
  fill(71, 85, 105);
  textSize(min(width * 0.025, 20));
  textStyle(NORMAL);
  if (score === 100) {
    text("🎉 太棒了！你是生活小達人！", width / 2, height * 0.43);
  } else if (score >= 80) {
    text("🌟 很厲害喔！表現非常優異！", width / 2, height * 0.43);
  } else {
    text("💪 再接再勵，再試一次會更好喔！", width / 2, height * 0.43);
  }

  // 繪製詳細答題反饋清單
  drawFeedbackDetails();

  // 執行彩帶動畫更新
  if (score >= 80) {
    updateAndDrawConfetti();
  }
}

// --- 繪製各題答題結果詳細反饋 ---
function drawFeedbackDetails() {
  let startY = height * 0.50;
  let lineHeight = 28;

  textSize(15);
  textAlign(LEFT, CENTER);

  for (let i = 0; i < targets.length; i++) {
    let t = targets[i];
    let isCorrect = (t.occupiedBy && t.occupiedBy.id === t.id);
    let yPos = startY + i * lineHeight;

    if (isCorrect) {
      fill(34, 197, 94);
      text(`  ✅ 答對：${t.text}`, width / 2 - 140, yPos);
    } else {
      fill(239, 68, 68);
      let userAns = t.occupiedBy ? t.occupiedBy.text : "未填";
      text(`  ❌ 答錯：${t.text} (你選: ${userAns})`, width / 2 - 140, yPos);
    }
  }
  // 恢復文字居中對齊
  textAlign(CENTER, CENTER);
}

// --- 彩帶粒子系統生成 ---
function createConfettiSystem() {
  confetti = [];
  let colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8B94', '#93C5FD', '#A7F3D0'];
  
  // 生成 120 個彩帶粒子
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: random(width),
      y: random(-height * 0.5, 0), // 從螢幕上方落下
      size: random(8, 15),
      color: color(random(colors)),
      speedY: random(3, 7),
      speedX: random(-2, 2),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.1, 0.1)
    });
  }
}

// --- 更新與繪製彩帶效果 ---
function updateAndDrawConfetti() {
  rectMode(CENTER);
  noStroke();

  for (let p of confetti) {
    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    fill(p.color);
    rect(0, 0, p.size, p.size * 0.6); // 繪製矩形彩帶片
    pop();

    // 更新位置與旋轉
    p.y += p.speedY;
    p.x += p.speedX + sin(frameCount * 0.05) * 0.5; // 風吹飄動感
    p.rotation += p.rotSpeed;

    // 循環飄落效果
    if (p.y > height) {
      p.y = random(-50, -10);
      p.x = random(width);
    }
  }
}