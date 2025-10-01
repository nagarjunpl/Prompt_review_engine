class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.setupGlobalAnimations();
    }

    setupGlobalAnimations() {
        // Add background particle animation
        this.createBackgroundAnimation();
        
        // Setup intersection observer for scroll animations
        this.setupScrollAnimations();
    }

    createBackgroundAnimation() {
        const canvas = document.createElement('canvas');
        canvas.id = 'background-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.opacity = '0.1';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let animationId;
        let particles = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            particles = [];
            const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
            
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 212, 255, ${particle.opacity})`;
                ctx.fill();
                
                // Draw connections to nearby particles
                particles.forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(0, 255, 136, ${0.1 * (1 - distance / 100)})`;
                        ctx.stroke();
                    }
                });
            });
            
            animationId = requestAnimationFrame(animate);
        };

        // Initialize
        resizeCanvas();
        createParticles();
        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            resizeCanvas();
            createParticles();
        });

        // Store cleanup function
        this.animations.set('background', () => {
            cancelAnimationFrame(animationId);
            canvas.remove();
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        document.querySelectorAll('.input-card, .stat-card').forEach(el => {
            observer.observe(el);
        });
    }

    animateButton(button, type = 'loading') {
        switch (type) {
            case 'loading':
                button.classList.add('loading');
                button.disabled = true;
                break;
            case 'success':
                button.classList.remove('loading');
                button.classList.add('success');
                setTimeout(() => {
                    button.classList.remove('success');
                    button.disabled = false;
                }, 2000);
                break;
            case 'error':
                button.classList.remove('loading');
                button.classList.add('error');
                setTimeout(() => {
                    button.classList.remove('error');
                    button.disabled = false;
                }, 2000);
                break;
            case 'reset':
                button.classList.remove('loading', 'success', 'error');
                button.disabled = false;
                break;
        }
    }

    animateStatusUpdate(statusElement, message, type = 'info') {
        const colors = {
            info: '#00d4ff',
            success: '#00ff88',
            warning: '#ffc107',
            error: '#ff453a'
        };

        statusElement.textContent = message;
        statusElement.style.color = colors[type];
        statusElement.style.transform = 'scale(1.1)';
        statusElement.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            statusElement.style.transform = 'scale(1)';
        }, 300);
    }

    animateCountUp(element, start, end, duration = 1000) {
        const range = end - start;
        const startTime = Date.now();

        const updateCount = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Use easing function for smooth animation
            const easeProgress = this.easeOutCubic(progress);
            const currentValue = Math.floor(start + (range * easeProgress));

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = end;
            }
        };

        requestAnimationFrame(updateCount);
    }

    animateChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        const values = Object.values(data);
        const labels = Object.keys(data);
        const maxValue = Math.max(...values, 1);
        
        const barWidth = width / labels.length - 20;
        const colors = {
            'ALLOW': '#00ff88',
            'NEEDS_FIX': '#ffc107',
            'BLOCK': '#ff453a'
        };
        
        let animationProgress = 0;
        const animationDuration = 1500;
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            animationProgress = Math.min(elapsed / animationDuration, 1);
            
            // Clear and redraw
            ctx.clearRect(0, 0, width, height);
            
            labels.forEach((label, index) => {
                const value = values[index];
                const barHeight = (value / maxValue) * (height - 40) * this.easeOutCubic(animationProgress);
                
                const x = index * (barWidth + 20) + 10;
                const y = height - barHeight - 20;
                
                // Draw bar
                ctx.fillStyle = colors[label] || '#8a2be2';
                ctx.fillRect(x, y, barWidth, barHeight);
                
                // Draw value on top
                if (animationProgress > 0.8) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(value, x + barWidth / 2, y - 5);
                }
                
                // Draw label
                ctx.fillStyle = '#a0a0b8';
                ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(label, x + barWidth / 2, height - 5);
            });
            
            if (animationProgress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    createRippleEffect(element, x, y) {
        const ripple = document.createElement('div');
        const size = Math.max(element.offsetWidth, element.offsetHeight);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (x - size / 2) + 'px';
        ripple.style.top = (y - size / 2) + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s ease-out';
        ripple.style.pointerEvents = 'none';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    cleanup() {
        // Clean up all animations
        this.animations.forEach(cleanup => cleanup());
        this.animations.clear();
    }
}

// Add ripple effect CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(1);
            opacity: 0;
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.8s ease-out;
    }
    
    .btn.success {
        background: linear-gradient(135deg, #00ff88, #00cc6a) !important;
        transform: scale(1.02);
    }
    
    .btn.error {
        background: linear-gradient(135deg, #ff453a, #cc3629) !important;
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Export for use in other files
window.AnimationManager = AnimationManager;