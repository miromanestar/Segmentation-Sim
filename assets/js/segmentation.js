
$(document).ready(function() {

});

var Sim =  {
    segments: { length: 0, identifier: 0, items: {} },
    size: 0,
    max: 0,

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
        segment.number = this.segments.identifier;

        this.addSegment(segment);
    },

    addSegment(segment) {
        let check = this.checkBounds(segment);
        if (!check.result) {
            alert(check.msg);
            return;
        }
            

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
            $('#seg-table-area .no-segs-msg').addClass('hide-seg-table-alert');
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

        let start = segment.direction === 'Positive' ? segment.offset : segment.offset - segment.size;
        let end = start + segment.size;
        if (end > this.max)
            this.max = end;
        $('#pas-input').attr('min', this.max);

        this.segments.items[segment.number] = segment;
        this.segments.length++;
        this.segments.identifier++;
        this.drawSegment(segment);
        $.fancybox.close();
    },

    checkBounds(s) {
        let start = s.direction === 'Positive' ? s.offset : s.offset - s.size;
        let end = start + s.size;

        for (let segno in this.segments.items) {
            let seg = this.segments.items[segno]
            let seg_start = seg.direction === 'Positive' ? seg.offset : seg.offset - seg.size;
            let seg_end = seg_start + seg.size;

            if (start < seg_end && seg_start < end) {
                    return {
                        result: false,
                        msg: `Segment bounds overlaps with segment ${ seg.number }`
                    }
            }

            if (end > this.size || start > this.size) {
                return {
                    result: false,
                    msg: `Segment goes beyond length of address space`
                }
            }
        }

        return {
            result: true,
            msg: `Segment ${ s.number } fits within bounds`
        };
    },

    drawSegments() {
        $('#pas-area').empty();
        for (let s in this.segments.items)
            this.drawSegment(this.segments.items[s]);
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

        delete this.segments.items[number];
        this.segments.length--;

        let tMax = 0;
        for (let s in this.segments.items) {
            let segment =this.segments.items[s]
            let start = segment.direction === 'Positive' ? segment.offset : segment.offset - segment.size;
            let end = start + segment.size;

            if (end > tMax)
                tMax = end;
        }
        this.max = tMax;
        $('#pas-input').attr('min', this.max);

        if (this.segments.length === 0) {
            $('#seg-table-area .no-segs-msg').removeClass('hide-seg-table-alert');
            $(`#seg-table thead, #seg-table tbody`).remove();
        }

        $.fancybox.close();
    },

    toggleSegBtn(input) {
        this.size = input.val();
        if (input.val() > 0) {
            $('.add-seg-btn').removeClass('disabled');
            $('#pas-area').empty()
        } else {
            $('.add-seg-btn').addClass('disabled');
            $('#pas-area').empty().append(`
                <div class="pas-null display-4">Please enter a PAS length</div>
            `);

            return;
        }
        
        this.drawSegments();
        this.drawAxis();
    },

    drawAxis() {
        let length = $('#pas-area').width();

        for (let i = 1; i < 10; i++) {
            let realPos = (i * .1) * this.size;
            let relativePos = (realPos / this.size) * length;

            $('#pas-area').append(`
                <div class="pas-axis" style="left: ${ relativePos - 6 };">${ Math.round(realPos) }</div>
            `);
        }
    }
};