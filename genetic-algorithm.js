function GeneticAlgorithm(runnerInstance) {
    function AiPlayer(brain, indexOfPlayer) {
        this.index = indexOfPlayer;
        this.gamePlayer = runnerInstance.players[indexOfPlayer];
        this.brain = brain;
        this.isPressingJump = false;
        this.isPressingDuck = false;

        this.processJumpPressState = function (pressingJump) {
            if (pressingJump) {
                if (!this.isPressingJump)
                    this.gamePlayer.onJumpKeyDown();
            }
            else {
                if (this.isPressingJump)
                    this.gamePlayer.onJumpKeyUp();
            }
        }

        this.processDuckPressState = function (pressingDuck) {
            if (pressingDuck) {
                if (!this.isPressingDuck)
                    this.gamePlayer.onDuckKeyDown();
            }
            else {
                if (this.isPressingDuck)
                    this.gamePlayer.onDuckKeyUp();
            }
        }
    }
    const numberOfPlayersPerGeneration = 30;

    const Neat = neataptic.Neat;
    const neat = new Neat(
        7,
        2,
        null,
        {
            //mutation: methods.mutation.ALL,
            popsize: numberOfPlayersPerGeneration,
            mutationRate: 0.5,
            elitism: 10
            /*network: new architect.Random(
            7,
            9,
            2
            )*/
        }
    );

    const aiPlayers = [];
    function initTraining() {
        
        addPlayersToGame();
        startGeneration();
        initGame();
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
    }

    function processState(aiPlayer, gameState) {
        const playerState = gameState.players[aiPlayer.index];

        updateScore(aiPlayer.brain, playerState.score);
        if (playerState.crashed)
            return;

        const neuralNetworkInputs = getNeuralNetworkInputs(playerState, gameState);

        movePlayer(aiPlayer, neuralNetworkInputs);
    }

    function updateScore(playerBrain, newScore) {
        playerBrain.score = newScore;
    }

    function getNeuralNetworkInputs(playerState, gameState) {
        return [
            playerState.xPos,
            playerState.yPos,
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