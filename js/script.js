const slider = new Swiper(".info-slider", {
    slidesPerView: 2,
    spaceBetween: 20,
    loop: true,
    speed: 800,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },

  
    breakpoints: {
      0: {
        slidesPerView: 1
      },
      768: {
        slidesPerView: 2
      }
    }
  });

  document.querySelector(".drop-menu").addEventListener("click", function () {
    this.classList.toggle("is-active");
    document.querySelector(".main-menu").classList.toggle("open");
    document.body.classList.toggle("overflow");
    document.documentElement.classList.toggle("overflow");
});