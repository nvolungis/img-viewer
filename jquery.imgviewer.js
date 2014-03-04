(function($){
  
  // I like the simple api this provides for event transmission between regular old objs.
  // via James Padolsey http://james.padolsey.com/javascript/jquery-eventemitter/
  $.eventEmitter = $.eventEmitter || {
    _JQInit: function() {
      this._JQ = $(this);
    },

    emit: function(evt, data) {
      !this._JQ && this._JQInit();
      this._JQ.trigger(evt, data);
    },

    on: function(evt, handler) {
      !this._JQ && this._JQInit();
      this._JQ.bind(evt, handler);
    },

    off: function(evt, handler) {
      !this._JQ && this._JQInit();
      this._JQ.unbind(evt, handler);
    }
  };
  
  
  //save this little guy for later
  var $window = $(window);

  
  // the main plugin class
  function ImgViewer($el, options){
    this.$el = $el;
    this.options = options;
    this.init();
  };

  $.extend(ImgViewer.prototype, {

    // create the modal subclass and bind events
    init: function(){
      this.modal = new Modal(this.options);
      this.bind();          
    },

    // determine the position the cloned image should be inserted at.
    capture_attrs: function(){
      var viewport = this.get_viewport();

      return {
        //adjust the top position from it's absolute position 
        //to one relative to a fixed position overlay
        top: this.$el.offset().top - viewport.top,

        left: this.$el.offset().left,
        width: this.$el.width(),
        src: this.$el.attr('src')
      } 
    },

    // the 'viewport', aka how far we've scrolled down the page
    get_viewport: function(){
      return {
        top: $(window).scrollTop(),
      }              
    },

    // figure out how large the display image should be, 
    // as well as where it should live.
    get_target_attrs: function(){
      var ar = this.$el.height() / this.$el.width(),
          width = ($window.height() - this.options.display_padding * 2) / ar,
          left = ($window.width() - width) / 2;

      return {
        top: this.options.display_padding,
        left: left,
        width: width
      }
    },
      
    bind: function(){
      this.$el.on('click',   this.open_modal.bind(this));
      this.modal.on('close', this.close_modal.bind(this));

      this.modal.on('close:after', function(){
        this.$el.removeClass('expanded');
      }.bind(this));
    },

    open_modal: function(){
      var current  = this.capture_attrs(),
          target = this.get_target_attrs();

      this.modal.open(current, target);
      this.$el.addClass('expanded');

      $window.on('resize.imagemodal', this.resize_image.bind(this));
    },

    close_modal: function(){
      this.modal.close(this.capture_attrs());
      $window.off('resize.imagemodal');
    }, 

    resize_image: function(){
      var attrs = this.get_target_attrs();
      this.modal.position_image(attrs);
    }
  });






  // responsible for all things modal
  // * creating the modal
  // * adding the modal to the dom
  // * cloning the image
  // * adding the image to modal
  // * positioning the image
  // * closing the image
  
  function Modal(options){
    this.options = options; 
    this._instance_id = Math.floor(Math.random() * 100);
  };

  $.extend(Modal.prototype, jQuery.eventEmitter, {
    open: function(current, target){
      this.modal = $('<div />').addClass('modal');
      this.img = $('<img />').attr('src', current.src);
      this.position_image(current);
      if(this.options.style_modal) this.style_modal()
      this.modal.append(this.img);

      setTimeout(function(){
        this.position_image(target, true);
        this.modal.addClass('active');
        if(!this.options.js_animate) this.trans_classes();
      }.bind(this), 50);

      this.modal.on('click',function(){
        this.emit('close');
      }.bind(this));

      $('body').append(this.modal);
    },
    
    close: function(target){
      this.modal.off('click');             
      this.modal.removeClass('active');
      this.position_image(target, true);

      if(!this.options.js_animate) this.trans_classes();
      setTimeout(function(){
        this.modal.remove();
        this.emit('close:after');
      }.bind(this) , this.options.transition_duration);
    },

    style_modal: function(){
      this.modal.css({
        position: 'fixed',
        top:0,
        right:0,
        bottom:0,
        left:0,
        'z-index': 10
      });             
    },

    position_image: function(attrs, animate){
     var target = {
        'position': 'absolute',
        'z-index':100,
        'top':attrs.top,
        'left':attrs.left,
        'width':attrs.width,
      };

      if (animate && this.options.js_animate) {
        this.img.animate(target, this.options.transition_duration);
      } else {
        this.img.css(target);
      }
    },

    trans_classes: function(){
      this.img.addClass('transitioning');               
      setTimeout(function(){
        this.img.removeClass('transitioning');
      }.bind(this), this.options.transition_duration);
    }
  });



  $.fn.imgViewer = function(options){
    var defaults = {
      style_modal: true,
      modal_class: 'modal',
      display_padding: 40,
      transition_duration: 500,
      js_animate: true
    };


    this.each(function(){
      new ImgViewer($(this), $.extend({}, defaults, options));
    });
  };
}(jQuery));
