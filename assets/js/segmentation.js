
$(document).ready(function() {

});

var Sim =  {
    segments: [],
    size: 0,

    parseSegmentForm(formData) {
        let segment = {
            number: -1,
            offset: -1, 
            size: -1, 
            direction: null,
        };
        
        segment.offset = parseInt(formData[0].value);
        segment.size = parseInt(formData[1].value);
        segment.direction = formData[2].value;
        segment.number = this.segments.length;

        this.addSegment(segment);
    },

    addSegment(segment) {
        if (this.segments.length === 0) {
            $('#seg-table').append(`
            <thead>
                <tr>
                    <th>Number</th>
                    <th>Offset</th>
                    <th>Size</th>
                    <th>Direction</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
            `);
            $('#seg-table-area .alert').addClass('hide-seg-table-alert');
            $('#seg-table-area table div').hide();
        }

        $('#seg-table tbody').append(`
        <tr id="seg-table_${ segment.number }" data-fancybox data-src="#pas-seg-lightbox_${ segment.number }">
            <td>${ segment.number }</td>
            <td>${ segment.offset }</td>
            <td>${ segment.size }</td>
            <td>${ segment.direction }</td>
        </tr>
        `);

        this.segments.push(segment);

        this.drawSegment(segment);

    },

    drawSegments() {
        $('#pas-area').empty();
        for (let s of this.segments)
            this.drawSegment(s);
    },

    drawSegment(s) {
        let length = $('#pas-area').width();

        let relativePos = (s.offset / this.size) * length; //Translate the imagined position of the segment to the actual position
        let relativeSize = (s.size / this.size) * length; 

        let style = `
            left: ${ s.direction !== 'Negative' ? relativePos : relativePos - relativeSize }; 
            width: ${ relativeSize };
            background-color: ${ s.direction !== 'Negative' ? 'blue' : 'red' };
        `;

        $('#pas-area').append(`
            <div class="pas-seg" id="pas-seg_${ s.number }" data-fancybox data-src="#pas-seg-lightbox_${ s.number }" style="${ style }">
                <div class="seg-identifier">${ s.number }</div>
            </div>

            <div id="pas-seg-lightbox_${ s.number }" class="pas-seg-lightbox" style="display: none;">
                <div class="overlay-content">
                    <p>Segment Number: ${ s.number }</p>
                    <p>Offset: ${ s.offset }</p>
                    <p>Size: ${ s.size }</p>
                    <p>Direction: ${ s.direction }</p>
                    <button type="button" class="btn btn-danger" onclick="Sim.deleteSegment(${ s.number });">Delete Segment</button>
                </div>
            </div>
        `);
    },

    deleteSegment(number) {
        $(`#pas-seg_${ number }, #pas-seg-lightbox_${ number }`).remove();
        $(`#seg-table_${ number }`).remove();
        this.segments = this.segments.splice(number, number);

        if (this.segments.length === 0) {
            $('#seg-table-area .alert').removeClass('hide-seg-table-alert');
            $(`#seg-table thead, #seg-table tbody`).remove();
        }

        $.fancybox.close();
    },

    toggleSegBtn(input) {
        this.size = input.val();
        if (input.val() > 0)
            $('.add-seg-btn').removeClass('disabled');
        else
            $('.add-seg-btn').addClass('disabled');
        
        this.drawSegments();
    }
};