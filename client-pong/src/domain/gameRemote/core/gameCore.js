export const gameCore = (canvas) => {
  const ctx = canvas.getContext("2d");

  // Função para limpar o canvas
  const clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Função para renderizar o estado do jogo
  const renderState = (state) => {
    if (!state || !state.ball || !state.paddles || !state.scores) {
      console.error("Estado inválido recebido para renderização:", state);
      return;
    }

    const { ball, paddles, scores } = state;

    // Limpa o canvas
    clearCanvas();

    // Fundo do jogo
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Linha central tracejada
    ctx.strokeStyle = "white";
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Placar
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${scores.left} - ${scores.right}`, canvas.width / 2, 30);

    // Paddles
    ctx.fillStyle = "white";
    ctx.fillRect(10, paddles.left || 0, 10, 100); // Paddle esquerdo com fallback
    ctx.fillRect(canvas.width - 20, paddles.right || 0, 10, 100); // Paddle direito com fallback

    // Bola
    ctx.beginPath();
    ctx.arc(ball.x || canvas.width / 2, ball.y || canvas.height / 2, 10, 0, Math.PI * 2); // Bola com fallback
    ctx.fillStyle = "white";
    ctx.fill();
  };

  return { renderState, clearCanvas };
};
