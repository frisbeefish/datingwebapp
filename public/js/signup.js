
var controller = (function() {

    var m_avatarIndex = 0;

    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    function init() {
        var imageUrl = null;
        m_avatarIndex = getRandomArbitrary(1,6);

        //
        // Put some radom female image in the upper right corner of the "sign up" form.
        //
        imageUrl = 'images/girl' + m_avatarIndex + '.png';
        $('.avatar').attr('src',imageUrl);
        $('#avatarimage').val(imageUrl)

        //
        // Whenever the user changes their gender via the sign up form, modify their avatar image (in the upper right
        // corner of the form) to match the selected gender. These images are randomly chosen from a group of 5 male and 5 
        // female images.
        //
        $('input:radio[name=mysex]').change(function () {
           
            if ($("input[name='mysex']:checked").val() == 'Male') {
                imageUrl = 'images/man' + m_avatarIndex + '.png';
            } else {
                imageUrl = 'images/girl' + m_avatarIndex + '.png';
            }

            $('.avatar').attr('src',imageUrl);
            $('#avatarimage').val(imageUrl)
        });

        
    }

    return {
        init:function() {
            init();
        }
    }

})();

$(controller.init)
