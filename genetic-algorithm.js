setInterval(async () => {
    console.log("AI is moving!");
    const aiPlayer = RunnerObj.players[1];
    aiPlayer.onJumpKeyDown();
    await sleep(200);
    aiPlayer.onJumpKeyUp();
    await sleep(300);
    //aiPlayer.onDuckKeyDown();
    await sleep(100);
    //aiPlayer.onDuckKeyUp();
}, 3000);