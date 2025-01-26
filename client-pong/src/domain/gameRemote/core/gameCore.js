export const gameCore = (canvas) => {
  const ctx = canvas.getContext("2d");

  const renderState = (state) => {
    const { ball, paddles, scores } = state;

    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    ctx.fillRect(10, paddles.left, 10, 100); // Paddle esquerdo
    ctx.fillRect(canvas.width - 20, paddles.right, 10, 100); // Paddle direito

    // Bola
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2); // Tamanho da bola aumentado para 10 para visualização melhor
    ctx.fillStyle = "white";
    ctx.fill();
  };

  return { renderState };
};
