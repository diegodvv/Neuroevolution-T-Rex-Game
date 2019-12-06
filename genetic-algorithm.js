function GeneticAlgorithm(runnerInstance) {
    function AiPlayer(brain, indexOfPlayer) {
        this.index = indexOfPlayer;
        this.gamePlayer = runnerInstance.players[indexOfPlayer];
        this.brain = brain;
        this.isPressingJump = false;
        this.isPressingDuck = false;
        this.crashed = false;
        this.jumpCount = 0;
        this.duckCount = 0;

        this.processJumpPressState = function (pressingJump) {
            if (pressingJump) {
                if (!this.isPressingJump) {
                    this.gamePlayer.onJumpKeyDown();
                    this.isPressingJump = true;

                    if (!this.isPressingDuck)
                        this.jumpCount++;
                }
            }
            else {
                if (this.isPressingJump) {
                    this.gamePlayer.onJumpKeyUp();
                    this.isPressingJump = false;
                }
            }
        }

        this.processDuckPressState = function (pressingDuck) {
            if (pressingDuck) {
                if (!this.isPressingDuck) {
                    this.gamePlayer.onDuckKeyDown();
                    this.isPressingDuck = true;
                    this.duckCount++;
                }
            }
            else {
                if (this.isPressingDuck) {
                    this.gamePlayer.onDuckKeyUp();
                    this.isPressingDuck = false;
                }
            }
        }
    }
    const numberOfPlayersPerGeneration = 50;

    const Neat = neataptic.Neat;
    const Architect = neataptic.Architect;

    const inputCount = 8;
    const outputCount = 2;
    const neat = new Neat(
        inputCount,
        outputCount,
        null,
        {
            //mutation: methods.mutation.ALL,
            popsize: numberOfPlayersPerGeneration,
            mutationRate: 0.3,
            elitism: 5,
            network: new Architect.Random(
            inputCount,
            inputCount + outputCount,
            outputCount
            )
        }
    );

    neat.generation = 1;
    const aiPlayers = [];

    const tableContainer = document.getElementById("table-container");
    const generationNumberLabel = document.getElementById("generation-number-label");
    function initTraining() {
        addPlayersToGame();
        startGeneration();
        initGame();
    }

    function updateHTMLVisualization() {
        generationNumberLabel.innerHTML = neat.generation;
        tableContainer.innerHTML = getTableString();
    }

    function getTableString() {
        function getOriginalScore(currentScore, jumpInfluence, duckInfluence) {
            return currentScore - (jumpInfluence + duckInfluence);
        }

        function getYesOrNoStringFromBoolean(boolean) {
            return boolean ? "Yes" : "No";
        }

        let tableHTML = "<table>";
        tableHTML += "<tr>";
        tableHTML += "<th>Index</th>";
        tableHTML += "<th>Alive</th>";
        tableHTML += "<th>Game Score</th>";
        tableHTML += "<th>Bonus Score</th>";
        tableHTML += "<th>Pressing Jump</th>";
        tableHTML += "<th>Pressing Duck</th>";
        tableHTML += "<th>Jump Count</th>";
        tableHTML += "<th>Duck Count</th>";
        tableHTML += "</tr>";
        
        aiPlayers.forEach((aiPlayer, index) => {
            const currentScore = aiPlayer.brain.score;

            const jumpInfluence = getJumpInfluenceInScore(aiPlayer.jumpCount);
            const duckInfluence = getJumpInfluenceInScore(aiPlayer.duckCount);

            const changeInScore = jumpInfluence + duckInfluence;

            const originalScore = currentScore - changeInScore;

            const tableRowClass = aiPlayer.crashed ? "crashed" : "alive";
            tableHTML += "<tr class=\"" + tableRowClass + "\">";

            tableHTML += "<td>" + index + "</td>";
            tableHTML += "<td>" + getYesOrNoStringFromBoolean(!aiPlayer.crashed) + "</td>";
            tableHTML += "<td>" + Math.round(originalScore/100) + " </td>";
            tableHTML += "<td>" + Math.round(changeInScore/10) + " </td>";
            tableHTML += "<td>" + getYesOrNoStringFromBoolean(aiPlayer.isPressingJump) + "</td>";
            tableHTML += "<td>" + getYesOrNoStringFromBoolean(aiPlayer.isPressingDuck) + "</td>";
            tableHTML += "<td>" + aiPlayer.jumpCount + "</td>";
            tableHTML += "<td>" + aiPlayer.duckCount + "</td>";

            tableHTML += "</tr>";
        });
        tableHTML += "</table>";

        return tableHTML;
    }

    function initGame() {
        subscribeUpdateFunction();
        startGame();
    }

    function subscribeUpdateFunction() {
        runnerInstance.subscribe(onEachUpdate);
    }

    function addPlayersToGame() {
        for (let i = 0; i < numberOfPlayersPerGeneration; ++i) {
            runnerInstance.addPlayer();
        }
    }

    function startGame() {
        runnerInstance.playIntro();
    }

    function onEachUpdate(gameState) {
        if (gameState.allPlayersCrashed) {
            endGeneration();
            return;
        }

        aiPlayers.forEach((aiPlayer) => {
            processState(aiPlayer, gameState);
        });

        updateHTMLVisualization();
    }

    function processState(aiPlayer, gameState) {
        const playerState = gameState.players[aiPlayer.index];

        updateScore(aiPlayer, playerState.score);
        aiPlayer.crashed = playerState.crashed;
        if (playerState.crashed)
            return;

        const neuralNetworkInputs = getNeuralNetworkInputs(playerState, gameState);

        movePlayer(aiPlayer, neuralNetworkInputs);
    }

    function updateScore(aiPlayer, gameScore) {
        const jumpInfluence = getJumpInfluenceInScore(aiPlayer.jumpCount);
        const duckInfluence = getDuckInfluenceInScore(aiPlayer.duckCount);
        aiPlayer.brain.score = gameScore + jumpInfluence + duckInfluence;
    }

    function getJumpInfluenceInScore(jumpCount) {
        return /*jumpCount * 10*/0;
    }

    function getDuckInfluenceInScore(duckCount) {
        return /*duckCount * 20*/0;
    }

    function getNeuralNetworkInputs(playerState, gameState) {
        return [
            playerState.xPos,
            playerState.yPos,
            playerState.jumpVelocity,
            gameState.velocity,
            gameState.closestObstacle.yPos,
            gameState.closestObstacle.xPos,
            gameState.closestObstacle.width,
            gameState.closestObstacle.height
        ];
    }

    function movePlayer(aiPlayer, neuralNetworkInputs) {
        // activate the neural network (aka "where the magic happens")
        const playerBrain = aiPlayer.brain;
        const outputs = playerBrain.activate(neuralNetworkInputs).map(o => Math.round(o));
        const jumpPressed = Math.round(outputs[0]);
        const duckPressed = Math.round(outputs[1]);

        aiPlayer.processJumpPressState(jumpPressed);
        aiPlayer.processDuckPressState(duckPressed);
    }

    function startGeneration() {
        const generationNumber = neat.generation;
        console.log("Generation: " + generationNumber);

        if (aiPlayers.length == 0) {
            neat.population.forEach((brain, index) => {
                aiPlayers.push(new AiPlayer(brain, index));
            });
        }
        else {
            neat.population.forEach((brain, index) => {
                aiPlayers[index] = new AiPlayer(brain, index);
            });
        }

        aiPlayers.forEach((aiPlayer) => {
            aiPlayer.brain.score = 0;
        });
    }

    function endGeneration () {
        neat.sort();
    
        /*this.onEndGeneration({
          generation: this.neat.generation,
          max: this.neat.getFittest().score,
          avg: Math.round(this.neat.getAverage()),
          min: this.neat.population[this.neat.popsize - 1].score
        })*/
    
        const newGeneration = [];
    
        for (let i = 0; i < neat.elitism; i++) {
          newGeneration.push(neat.population[i]);
        }
    
        for (let i = 0; i < neat.popsize - neat.elitism; i++) {
          newGeneration.push(neat.getOffspring())
        }
    
        neat.population = newGeneration;
        neat.mutate();
        neat.generation++;
        startGeneration();
        restartGame();
      }

    function restartGame() {
        runnerInstance.restart();
    }

    initTraining();
}