const fitaTrack = document.querySelector('.fita-track');
const items = document.querySelectorAll('.fita-item');

if (fitaTrack && items.length > 0) {
    const originalHTML = fitaTrack.innerHTML;
    let originalWidth = fitaTrack.scrollWidth;

    while (fitaTrack.scrollWidth < originalWidth * 2 || fitaTrack.scrollWidth < window.innerWidth * 2) {
        fitaTrack.innerHTML += originalHTML;
    }

    const singleBlockWidth = originalWidth;

    let position = 0;
    const speed = 0.5;

    function animate() {
        position -= speed;

        if (Math.abs(position) >= singleBlockWidth) {
            position += singleBlockWidth;
        }

        fitaTrack.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate);
    }

    animate();
}