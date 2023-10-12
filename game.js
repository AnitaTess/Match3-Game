let game;
let gameOptions = {
    gemSize: 100,
    swapSpeed: 200,
    fallSpeed: 100,
    destroySpeed: 200,
    boardOffset: {
        x: 100,
        y: 50
    }
}

window.onload = function() {
   console.log(document.querySelector('.anita-game-data-panel'));
    let gameConfig = {
        width: 900,
        height: 900,
        scene: playGame,
        backgroundColor: 0x222222
    }
    game = new Phaser.Game(gameConfig);
    window.focus()
    resize();
    window.addEventListener("resize", resize, false);
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
        this.score = 0;
        //this.userScoreNonce;
    }

    startGame() {
        // Start the countdown timer
        this.countdown = 180; // 3 minutes
        //this.countdown = 15; // 15 secs
        this.timerText = this.add.text(700, 20, "Time: 3:00", {
            fontSize: "24px",
            fill: "#ffffff"
        });
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    
        // Enable gem selection and gameplay
        this.canPick = true;
        this.dragging = false;
    }

    shuffleBoard() {
        this.cleanupField();

        if (this.canPick) {
            this.canPick = false;
            this.selectedGem = null;
    
            // Shuffle the board
            this.match3.shuffleBoard();
    
            // Redraw the field with the shuffled board
            this.drawField();
    
            // Allow player input again after a short delay
            this.time.delayedCall(500, function() {
                this.canPick = true;
            }, [], this);
        }
    }

    ajaxCall(score){
        const gamePanel = document.querySelector('.anita-game-data-panel');
        jQuery.ajax({
            type: 'POST',
            url: `${gamePanel.dataset.link}?nonce=${gamePanel.dataset.nonce}`,
            data: {
                action: 'anita_game_highscore',
                user_id: gamePanel.dataset.user_id,
                anita_gamescore: score,
            },
            dataType: 'json',
            success: function (response) {
                console.log('AJAX works!!!');
                console.log(response);
                //$('.ajax-response-text').html('Time: ' + response.data.time + '<br/>Turns: ' + response.data.turns);
                if(response.data.text === 'New Highscore'){
					 Swal.fire({
  title: 'New High Score!',
  text: 'This is your best score so far!\nPlay again to beat it!',
  icon: 'info',
  confirmButtonText: 'OK'
	});
                }
            }

        });
    }
    
    updateTimer() {
        this.countdown--;
        let minutes = Math.floor(this.countdown / 60);
        let seconds = this.countdown % 60;
        let formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timerText.setText("Time: " + formattedTime);
    
        if (this.countdown <= 0) {
            // Game over
            this.timerEvent.destroy();
            this.canPick = false;
            this.input.off("pointerdown", this.gemSelect, this);
            this.timerText.setText("Time's up!");
            // Add game over logic here
             Swal.fire({
  title: 'Time is up!',
  text: 'You scored ' + this.score,
  icon: 'info',
  confirmButtonText: 'OK'
	});
            this.ajaxCall(this.score);
            this.shuffleButton.style.display = "none";
            restartButton.style.display = "block";
            // ...
        }
    }
    

    preload(){
        this.load.spritesheet("gems", "https://linktoyourimage.png", {
            frameWidth: gameOptions.gemSize,
            frameHeight: gameOptions.gemSize
        });
    }
    create(){
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "25px",
            fill: "#ffffff"
          });
        this.match3 = new Match3({
            rows: 8,
            columns: 7,
            items: 6
        });
        this.match3.generateField();
        this.canPick = false;
        this.dragging = false;
        this.cleanupField();
        this.drawField();
       this.startButton = document.getElementById("akcja");
       this.startButton.addEventListener("click", this.startGame.bind(this));
        this.shuffleButton = document.getElementById("shuffleButton");
    this.shuffleButton.addEventListener("click", this.shuffleBoard.bind(this));
        this.input.on("pointerdown", this.gemSelect, this);
    }

    cleanupField() {
        if (this.match3) {
          for (let i = 0; i < this.match3.getRows(); i++) {
            for (let j = 0; j < this.match3.getColumns(); j++) {
              const gem = this.match3.customDataOf(i, j);
              if (gem) {
                gem.destroy(); // Remove the gem sprite
              }
            }
          }
        }
      }

    drawField(){
        this.poolArray = [];
        for(let i = 0; i < this.match3.getRows(); i ++){
            for(let j = 0; j < this.match3.getColumns(); j ++){
                let gemX = gameOptions.boardOffset.x + gameOptions.gemSize * j + gameOptions.gemSize / 2;
                let gemY = gameOptions.boardOffset.y + gameOptions.gemSize * i + gameOptions.gemSize / 2
                let gem = this.add.sprite(gemX, gemY, "gems", this.match3.valueAt(i, j));
                this.match3.setCustomData(i, j, gem);
            }
        }
    }
    gemSelect(pointer){
        if(this.canPick){
            this.dragging = true;
            let row = Math.floor((pointer.y - gameOptions.boardOffset.y) / gameOptions.gemSize);
            let col = Math.floor((pointer.x - gameOptions.boardOffset.x) / gameOptions.gemSize);
            if(this.match3.validPick(row, col)){
                let selectedGem = this.match3.getSelectedItem();
                if(!selectedGem){
                    this.match3.customDataOf(row, col).setScale(1.2);
                    this.match3.customDataOf(row, col).setDepth(1);
                    this.match3.setSelectedItem(row, col);
                }
                else{
                    if(this.match3.areTheSame(row, col, selectedGem.row, selectedGem.column)){
                        this.match3.customDataOf(row, col).setScale(1);
                        this.match3.deleselectItem();
                    }
                    else{
                        if(this.match3.areNext(row, col, selectedGem.row, selectedGem.column)){
                            this.match3.customDataOf(selectedGem.row, selectedGem.column).setScale(1);
                            this.match3.deleselectItem();
                            this.swapGems(row, col, selectedGem.row, selectedGem.column, true);
                        }
                        else{
                            this.match3.customDataOf(selectedGem.row, selectedGem.column).setScale(1);
                            this.match3.customDataOf(row, col).setScale(1.2);
                            this.match3.setSelectedItem(row, col);
                        }
                    }
                }
            }
        }
    }
    swapGems(row, col, row2, col2, swapBack){
        let movements = this.match3.swapItems(row, col, row2, col2);
        this.swappingGems = 2;
        this.canPick = false;
        movements.forEach(function(movement){
            this.tweens.add({
                targets: this.match3.customDataOf(movement.row, movement.column),
                x: this.match3.customDataOf(movement.row, movement.column).x + gameOptions.gemSize * movement.deltaColumn,
                y: this.match3.customDataOf(movement.row, movement.column).y + gameOptions.gemSize * movement.deltaRow,
                duration: gameOptions.swapSpeed,
                callbackScope: this,
                onComplete: function(){
                    this.swappingGems --;
                    if(this.swappingGems == 0){
                        if(!this.match3.matchInBoard()){
                            if(swapBack){
                                this.swapGems(row, col, row2, col2, false);
                                this.score -= 10;
                                this.scoreText.setText("Score: " + this.score);
                            }
                            else{
                                this.canPick = true;
                            }
                        }
                        else{
                            this.handleMatches();
                        }
                    }
                }
            })
        }.bind(this))
    }
    handleMatches(){
        let gemsToRemove = this.match3.getMatchList();
        let destroyed = 0;
        gemsToRemove.forEach(function(gem){
            this.poolArray.push(this.match3.customDataOf(gem.row, gem.column))
            this.score += 10;
            destroyed ++;
            this.tweens.add({
                targets: this.match3.customDataOf(gem.row, gem.column),
                alpha: 0,
                duration: gameOptions.destroySpeed,
                callbackScope: this,
                onComplete: function(event, sprite){
                    destroyed --;
                    if(destroyed == 0){
                        this.makeGemsFall();

                    }
                }
            });
        }.bind(this));
        this.scoreText.setText("Score: " + this.score);
    }
    makeGemsFall(){
        let moved = 0;
        this.match3.removeMatches();
        let fallingMovements = this.match3.arrangeBoardAfterMatch();
        fallingMovements.forEach(function(movement){
            moved ++;
            this.tweens.add({
                targets: this.match3.customDataOf(movement.row, movement.column),
                y: this.match3.customDataOf(movement.row, movement.column).y + movement.deltaRow * gameOptions.gemSize,
                duration: gameOptions.fallSpeed * Math.abs(movement.deltaRow),
                callbackScope: this,
                onComplete: function(){
                    moved --;
                    if(moved == 0){
                        this.endOfMove()
                    }
                }
            })
        }.bind(this));
        let replenishMovements = this.match3.replenishBoard();
        replenishMovements.forEach(function(movement){
            moved ++;
            let sprite = this.poolArray.pop();
            sprite.alpha = 1;
            sprite.y = gameOptions.boardOffset.y + gameOptions.gemSize * (movement.row - movement.deltaRow + 1) - gameOptions.gemSize / 2;
            sprite.x = gameOptions.boardOffset.x + gameOptions.gemSize * movement.column + gameOptions.gemSize / 2,
            sprite.setFrame(this.match3.valueAt(movement.row, movement.column));
            this.match3.setCustomData(movement.row, movement.column, sprite);
            this.tweens.add({
                targets: sprite,
                y: gameOptions.boardOffset.y + gameOptions.gemSize * movement.row + gameOptions.gemSize / 2,
                duration: gameOptions.fallSpeed * movement.deltaRow,
                callbackScope: this,
                onComplete: function(){
                    moved --;
                    if(moved == 0){
                        this.endOfMove()
                    }
                }
            });
        }.bind(this))
    }
    endOfMove(){
        if(this.match3.matchInBoard()){
            this.time.addEvent({
                delay: 250,
                callback: this.handleMatches()
            });
        }
        else{
            this.canPick = true;
            this.selectedGem = null;
        }
    }
}

class Match3{

    // constructor, simply turns obj information into class properties
    constructor(obj){
        this.rows = obj.rows;
        this.columns = obj.columns;
        this.items = obj.items;
    }

    shuffleBoard() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                do {
                    let randomValue = Math.floor(Math.random() * this.items);
                    this.gameArray[i][j] = {
                        value: randomValue,
                        isEmpty: false,
                        row: i,
                        column: j
                    };
                } while (this.isPartOfMatch(i, j));
            }
        }
    }    

    // generates the game field
    generateField(){
        this.gameArray = [];
        this.selectedItem = false;
        for(let i = 0; i < this.rows; i ++){
            this.gameArray[i] = [];
            for(let j = 0; j < this.columns; j ++){
                do{
                    let randomValue = Math.floor(Math.random() * this.items);
                    this.gameArray[i][j] = {
                        value: randomValue,
                        isEmpty: false,
                        row: i,
                        column: j
                    }
                } while(this.isPartOfMatch(i, j));
            }
        }
    }

    // returns true if there is a match in the board
    matchInBoard(){
        for(let i = 0; i < this.rows; i ++){
            for(let j = 0; j < this.columns; j ++){
                if(this.isPartOfMatch(i, j)){
                    return true;
                }
            }
        }
        return false;
    }

    // returns true if the item at (row, column) is part of a match
    isPartOfMatch(row, column){
        return this.isPartOfHorizontalMatch(row, column) || this.isPartOfVerticalMatch(row, column);
    }

    // returns true if the item at (row, column) is part of an horizontal match
    isPartOfHorizontalMatch(row, column){
        return this.valueAt(row, column) === this.valueAt(row, column - 1) && this.valueAt(row, column) === this.valueAt(row, column - 2) ||
                this.valueAt(row, column) === this.valueAt(row, column + 1) && this.valueAt(row, column) === this.valueAt(row, column + 2) ||
                this.valueAt(row, column) === this.valueAt(row, column - 1) && this.valueAt(row, column) === this.valueAt(row, column + 1);
    }

    // returns true if the item at (row, column) is part of an horizontal match
    isPartOfVerticalMatch(row, column){
        return this.valueAt(row, column) === this.valueAt(row - 1, column) && this.valueAt(row, column) === this.valueAt(row - 2, column) ||
                this.valueAt(row, column) === this.valueAt(row + 1, column) && this.valueAt(row, column) === this.valueAt(row + 2, column) ||
                this.valueAt(row, column) === this.valueAt(row - 1, column) && this.valueAt(row, column) === this.valueAt(row + 1, column)
    }

    // returns the value of the item at (row, column), or false if it's not a valid pick
    valueAt(row, column){
        if(!this.validPick(row, column)){
            return false;
        }
        return this.gameArray[row][column].value;
    }

    // returns true if the item at (row, column) is a valid pick
    validPick(row, column){
        return row >= 0 && row < this.rows && column >= 0 && column < this.columns && this.gameArray[row] != undefined && this.gameArray[row][column] != undefined;
    }

    // returns the number of board rows
    getRows(){
        return this.rows;
    }

    // returns the number of board columns
    getColumns(){
        return this.columns;
    }

    // sets a custom data on the item at (row, column)
    setCustomData(row, column, customData){
        this.gameArray[row][column].customData = customData;
    }

    // returns the custom data of the item at (row, column)
    customDataOf(row, column){
        return this.gameArray[row][column].customData;
    }

    // returns the selected item
    getSelectedItem(){
        return this.selectedItem;
    }

    // set the selected item as a {row, column} object
    setSelectedItem(row, column){
        this.selectedItem = {
            row: row,
            column: column
        }
    }

    // deleselects any item
    deleselectItem(){
        this.selectedItem = false;
    }

    // checks if the item at (row, column) is the same as the item at (row2, column2)
    areTheSame(row, column, row2, column2){
        return row == row2 && column == column2;
    }

    // returns true if two items at (row, column) and (row2, column2) are next to each other horizontally or vertically
    areNext(row, column, row2, column2){
        return Math.abs(row - row2) + Math.abs(column - column2) == 1;
    }

    // swap the items at (row, column) and (row2, column2) and returns an object with movement information
    swapItems(row, column, row2, column2){
        let tempObject = Object.assign(this.gameArray[row][column]);
        this.gameArray[row][column] = Object.assign(this.gameArray[row2][column2]);
        this.gameArray[row2][column2] = Object.assign(tempObject);
        return [{
            row: row,
            column: column,
            deltaRow: row - row2,
            deltaColumn: column - column2
        },
        {
            row: row2,
            column: column2,
            deltaRow: row2 - row,
            deltaColumn: column2 - column
        }]
    }

    // return the items part of a match in the board as an array of {row, column} object
    getMatchList(){
        let matches = [];
        for(let i = 0; i < this.rows; i ++){
            for(let j = 0; j < this.columns; j ++){
                if(this.isPartOfMatch(i, j)){
                    matches.push({
                        row: i,
                        column: j
                    });
                }
            }
        }
        return matches;
    }

    // removes all items forming a match
    removeMatches(){
        let matches = this.getMatchList();
        matches.forEach(function(item){
            this.setEmpty(item.row, item.column)
        }.bind(this))
    }

    // set the item at (row, column) as empty
    setEmpty(row, column){
        this.gameArray[row][column].isEmpty = true;
    }

    // returns true if the item at (row, column) is empty
    isEmpty(row, column){
        return this.gameArray[row][column].isEmpty;
    }

    // returns the amount of empty spaces below the item at (row, column)
    emptySpacesBelow(row, column){
        let result = 0;
        if(row != this.getRows()){
            for(let i = row + 1; i < this.getRows(); i ++){
                if(this.isEmpty(i, column)){
                    result ++;
                }
            }
        }
        return result;
    }

    // arranges the board after a match, making items fall down. Returns an object with movement information
    arrangeBoardAfterMatch(){
        let result = []
        for(let i = this.getRows() - 2; i >= 0; i --){
            for(let j = 0; j < this.getColumns(); j ++){
                let emptySpaces = this.emptySpacesBelow(i, j);
                if(!this.isEmpty(i, j) && emptySpaces > 0){
                    this.swapItems(i, j, i + emptySpaces, j)
                    result.push({
                        row: i + emptySpaces,
                        column: j,
                        deltaRow: emptySpaces,
                        deltaColumn: 0
                    });
                }
            }
        }
        return result;
    }

    // replenished the board and returns an object with movement information
    replenishBoard(){
        let result = [];
        for(let i = 0; i < this.getColumns(); i ++){
            if(this.isEmpty(0, i)){
                let emptySpaces = this.emptySpacesBelow(0, i) + 1;
                for(let j = 0; j < emptySpaces; j ++){
                    let randomValue = Math.floor(Math.random() * this.items);
                    result.push({
                        row: j,
                        column: i,
                        deltaRow: emptySpaces,
                        deltaColumn: 0
                    });
                    this.gameArray[j][i].value = randomValue;
                    this.gameArray[j][i].isEmpty = false;
                }
            }
        }
        return result;
    }
}
let shuffleButton = document.createElement("button");
shuffleButton.innerHTML = "Can't find a match? Shuffle!";
shuffleButton.id = 'shuffleButton';
let container1 = document.getElementById("contentt");
	container1.appendChild(shuffleButton);
shuffleButton.addEventListener ("click", function() {
    console.log("shuffled");
  });

let akcja = document.createElement("button");
akcja.innerHTML = "nic";
akcja.id = 'akcja';
let container44 = document.getElementById("contentt");
	container44.appendChild(akcja);
shuffleButton.addEventListener ("click", function() {
    console.log("hidden");
  });

let button = document.createElement("button");
button.innerHTML = "START GAME";
button.id = 'startGame';
let container2 = document.getElementById("contentt");
	container2.appendChild(button);
button.addEventListener ("click", function() {
   Swal.fire({
  title: 'Match 3',
  text: 'You have 3 minutes to get the highest score out of all players. Good luck!',
  icon: 'info',
  confirmButtonText: 'OK'
	}).then((result) => {
  if (result.isConfirmed) {
    // User clicked OK, execute your script here
    const buttonToClick = document.getElementById('akcja');
    if (buttonToClick) {
      buttonToClick.click();
    }
  }
});
    button.style.display = "none";
    shuffleButton.style.display = "block";
  });

  let restartButton = document.createElement("button");
  restartButton.innerHTML = "Restart";
  restartButton.id = 'restart';
let container3 = document.getElementById("contentt");
	container3.appendChild(restartButton);
restartButton.addEventListener ("click", function() {
    location.reload(); 
    console.log("restarted");
  });

function resize() {
    var canvas = document.querySelector("canvas");
	let container = document.getElementById("contentt");
	container.appendChild(canvas);
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) - 200 + "px";
        canvas.style.height = windowHeight - 200 + "px";
    }
}
