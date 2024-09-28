export const PADDLE_HEIGHT = 100;
export const PADDLE_THICKNESS = 10;

export function drawPaddle(ctx, topLeftX, topLeftY) {
    ctx.fillStyle = 'white';
    ctx.fillRect(topLeftX, topLeftY, PADDLE_THICKNESS, PADDLE_HEIGHT);
}
