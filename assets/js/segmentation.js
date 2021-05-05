$(document).ready(function() {
    sim = new Sim();
    sim.createSegment('Code', 8_000, 2_048, 'Positive', 0);
    sim.createSegment('Heap', 10_000, 2_048, 'Positive', 1);
    sim.createSegment('Stack', 16_000, 2_048, 'Negative', 3);

    $('#pas-input').val(16).change();
    $('#vas-input').val(13).change();
});

var sim = class {};

var Sim = class {
    constructor() {
        this.segments = { 
            length: 0, 
            nextSegmentNo: 0, //Does nothing for now
            items: {} 
        }

        window.addEventListener('resize', ev => this.handleResize());
    }

    createSegment(name, base, size, direction, num) {
        if (this.segments.length === 0) {
            $('#seg-table').append(`
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Number</th>
                    <th>Base</th>
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

        let number = num || this.segments.nextSegmentNo;
        $('#seg-table tbody').append(`
        <tr id="seg-table_${ number }">
            <td>${ name }</td>
            <td>${ binary(number, 2) }</td>
            <td><input id="base-input_${ number }" value="${ base }" type="number" min="0" class="minimal-input" onchange="sim.changeBase(${ number }, $(this).val());" placeholder="Base" style="width: 150px;" /></td>
            <td><input id="size-input_${ number }" value="${ size }" type="number" min="0" class="minimal-input" onchange="sim.changeSize(${ number }, $(this).val());" placeholder="Size" style="width: 150px;" /></td>
            <td>
                <select class="select-css" name="segment-direction" onchange="sim.changeDir(${ number }, $(this).val());" id="dir-input_${ number }">
                    <option>Positive</option>
                    <option ${ direction === 'Negative' ? 'selected' : '' }>Negative</option>
                </select>
            </td>
        </tr>
        `);

        this.segments.items[number] = {
            name: name,
            number: number,
            base: base,
            size: size,
            direction: direction
        }
        this.segments.length++;

        if (!num)
            this.segments.nextSegmentNo++;

        this.drawSegment(this.segments.items[number])
    }

    //Changes properties of a given segment given a segment number
    changeBase(sno, base) {
        if (base) {
            let temp = this.segments.items[sno].base;
            this.segments.items[sno].base = base;

            let check = this.checkBounds(this.segments.items[sno]);

            if (check.result) {
                $(`#pas-seg_${ sno }`).remove();
                this.drawSegments();
            } else {
                alert(check.msg);
                $(`#base-input_${ sno }`).val(temp)
                this.segments.items[sno].base = temp;
            }
        }
    }

    changeSize(sno, size) {
        if (size) {
            let temp = this.segments.items[sno].size;
            this.segments.items[sno].size = size;

            let check = this.checkBounds(this.segments.items[sno]);

            if (check.result) {
                $(`#pas-seg_${ sno }`).remove();
                this.drawSegments();
            } else {
                alert(check.msg);
                $(`#size-input_${ sno }`).val(temp)
                this.segments.items[sno].size = temp;
            }
        }
    }

    changeDir(sno, dir) {
        if (dir) {
            let temp = this.segments.items[sno].direction;
            this.segments.items[sno].direction = dir;

            let check = this.checkBounds(this.segments.items[sno]);

            if (check.result) {
                $(`#pas-seg_${ sno }, #vas-seg_${ sno }`).remove();
                this.drawSegments();
            } else {
                alert(check.msg);
                $(`#dir-input_${ sno }`).val(temp)
                this.segments.items[sno].direction = temp;
            }
        }
    }

    drawSegments() {
        $('.memory-area .seg').remove();
        for (let s in this.segments.items)
            this.drawSegment(this.segments.items[s]);
        this.translateAddress($('#translation-input').val(), true); //The true silences alerts from the function
    }

    drawSegment(s) {
        this.pSegment(s);
        this.vSegment(s);
    }

    pSegment(s) {
        if (!this.pLength)
            return;
        
        let length = $('#pas-area').width();

        let size = Math.pow(2, this.pLength);
        let relativePos = (s.base / size) * length;
        let relativeSize = (s.size / size) * length; 

        let style = `
            left: ${ s.direction !== 'Negative' ? relativePos : relativePos - relativeSize }; 
            width: ${ relativeSize };
            background-color: ${ s.direction !== 'Negative' ? 'blue' : 'red' };
        `;

        $('#pas-area').append(`
            <div class="seg" id="pas-seg_${ s.number }" style="${ style }">
                <div class="seg-identifier">${ binary(s.number, 2) }</div>
            </div>
        `);
    }

    //Draws segments in the virtual address space
    vSegment(s) {
        if (!this.vLength)
            return;

        let length = $('#vas-area').width();

        let vasSize = 4;
        let realPos = (s.number * .25) * vasSize;
        let relativePos = (realPos / vasSize) * length;
        
        //Calculates the space between each "segment" grid in the VAS and figures the relative size of each virtual segment
        let calcRelSize = () => {
            let nextPos = ( (s.number + 1) * .25) * vasSize;
            let nextRelativePos = (nextPos / vasSize) * length;

            let actualWidth = nextRelativePos - relativePos;
            let widthRatio = parseInt(s.size) / Math.pow(2, parseInt(this.vLength) - 2);
            return actualWidth * widthRatio;
        };

        let relativeSize = calcRelSize();

        let style = `
            left: ${ s.direction !== 'Negative' ? relativePos : relativePos - relativeSize }; 
            width: ${ relativeSize };
            background-color: ${ s.direction !== 'Negative' ? 'blue' : 'red' };
        `;

        $('#vas-area').append(`
            <div class="seg" id="vas-seg_${ s.number }" style="${ style }">
                <div class="seg-identifier">${ binary(s.number, 2) }</div>
            </div>
        `);
    }

    drawAxis() {
        this.pAxis();
        this.vAxis();
    }

    pAxis() {
        $('#pas-area .sim-axis, #pas-area .axis-separator').remove();

        if (this.pLength) {
            $('#pas-area .mem-null').hide();
        } else {
            $('#pas-area .mem-null').show();
            return;
        }

        let length = $('#pas-area').width();

        let size = Math.pow(2, this.pLength);

        for (let i = 0; i <= 8; i++) {
            let realPos = (i * .125) * size;
            let relativePos = (realPos / size) * length;

            let style = `left: ${ relativePos - 6 };`;
            if (i === 0)
                style = `left: ${ relativePos + 10 };`;
            else if (i === 8)
                style = `right: ${ 30 };`;

            $('#pas-area').append(`
                <div class="sim-axis" style="${ style };">${ Math.round(realPos) }</div>
            `);
        }
    }

    //Draw the virtual address space axis
    vAxis() {
        $('#vas-area .sim-axis, #vas-area .axis-separator').remove();

        if (this.vLength) {
            $('#vas-area .mem-null').hide();
        } else {
            $('#vas-area .mem-null').show();
            return;
        }

        let length = $('#vas-area').width();
        let vasSize = 4;

        for (let i = 0; i <= 4; i++) {
            let realPos = (i * .25) * vasSize;
            let relativePos = (realPos / vasSize) * length;

            if (i === 0)
                relativePos += 5;
            else if (i === 4)
                relativePos -= 50;

            $('#vas-area').append(`
                <div class="sim-axis" style="left: ${ relativePos };">${ binary(realPos, 2) }</div>
                <!--<div class="axis-separator" style="left: ${ relativePos };"></div>-->
            `);
        }
    }

    //Sets the length of the virtual address in bits
    setPas(num) {
        if (parseInt(num) < parseInt(this.vLength) + 1) {
            alert('Your physical address length must be greater than your virtual address length');
            $('#pas-input').val(this.pLength);
            return;
        }

        this.pLength = num;
        this.pAxis();
        this.drawSegments();
    }

    //Sets the length of the physical address in bits
    setVas(num) {
        if (!this.pLength) {
            alert('Please set a physical address length');
            $('#vas-input').val(this.vLength);
            return;
        } else if (num === '') { 
            this.vLength = num;
            this.vAxis();
            this.drawSegments();
            return;
        } else if (num && parseInt(num) + 1 > parseInt(this.pLength)) {
            alert(`Your VA length should be less than your PA length\nVA Length: ${ num }`);
            $('#vas-input').val(this.vLength);
            return;
        } else if (num <= 2) {
            alert('Your VA length must be greater than 2 (Because the first two bits are used to identify segment');
            $('#vas-input').val(this.vLength);
            return;
        }

        //Total size (in bytes) of a virtual segment
        let vSize = Math.pow(2, parseInt(num) - 2);
        for (let s in this.segments.items) {
            let seg = this.segments.items[s];

            if (seg.size > vSize) {
                alert(`Segment ${ binary(seg.number, 2) } is larger than your virtual address allows.\n
                VA Length: ${ parseInt(num) - 2 }: ${ vSize }\n
                VA Size: ${ vSize }\n
                Segment Size: ${ seg.size }
                `);
                $('#vas-input').val(this.vLength);
                return;
            }
        }

        this.vLength = num;
        this.vAxis();
        this.drawSegments();
    }

    //Translates a virtual address into a physical address and highlights the appropriate segments to show intersections
    translateAddress(num, isSilent) {
        $('.translate-seg').remove();
        if (!this.vLength) {
            if (!isSilent) {
                alert('You must enter a virtual address length');
                $('#translation-input').val('');
            }

            return;
        }

        if (num === '') {
            $('#translated-address').html('N/A');
            $('#seg-table tr').removeClass('selected-seg');
            $('.seg').removeClass('selected-seg');
            return;
        }

        num = parseInt(num);
        let bi = binary(num, this.vLength);

        let sno = bi.substr(0, 2); //Segment number
        let offset = parseInt(bi.substr(2), 2); //The actual virtual address bit

        if (sno !== this.lastSelectedSegment) {
            $('#seg-table tr').removeClass('selected-seg');
            $('.seg').removeClass('selected-seg');
        }

        try {
            this.drawTranslatedAddress(sno, offset);
        } catch (e) {
            $('#translated-address').html('Segfault');
            $('#seg-table tr').removeClass('selected-seg');
            $('.seg').removeClass('selected-seg');
            return;
        }

        $(`#seg-table_${ parseInt(sno, 2) }`).addClass('selected-seg');

        $(`#vas-seg_${ parseInt(sno, 2) }`).addClass('selected-seg');
        $(`#pas-seg_${ parseInt(sno, 2) }`).addClass('selected-seg');

        this.lastSelectedSegment = sno;
    }

    drawTranslatedAddress(sno, offset) {
        //Draw the "translated" address within the PAS
        let base = parseInt(this.segments.items[parseInt(sno, 2)].base)
        let size = parseInt(this.segments.items[parseInt(sno, 2)].size)

        //The physical address given the virtual address
        let pAddress = this.segments.items[parseInt(sno, 2)].direction === 'Positive' ? base + offset : base - offset;

        //Throw an error an exit function if the translated address is outside the bounds of a segment's physical bounds
        if (this.segments.items[parseInt(sno, 2)].direction === 'Positive' ? pAddress > base + size : pAddress < base - size) {
            throw 'pAddress out of bounds of a physical address';
        }

        $('#translated-address').html(pAddress);

        let relativePasPos = pAddress / Math.pow(2, parseInt(this.pLength)) * $('#pas-area').width();
        $('#pas-area').append(`
        <div class="translate-seg seg" id="pas-translate_${ parseInt(sno, 2) }" style="left: ${ relativePasPos }; width: 5px; background-color: lightblue; z-index: 7;">
            <!-- <div class="seg-identifier">${ binary(sno, 2) }</div> -->
        </div>
        `);

        //Now let's draw the virtual address within the VAS
        let relativeVasRatio = offset / parseInt(Math.pow(2, parseInt(this.vLength) - 2));
        let relativeVasPos = $(`#vas-area`).width() * .25 * relativeVasRatio + parseFloat($(`#vas-seg_${ parseInt(sno, 2) }`).css('left'));
        
        if (this.segments.items[parseInt(sno, 2)].direction === 'Negative') {
            let diff = relativeVasPos - parseFloat($(`#vas-seg_${ parseInt(sno, 2) }`).css('left'));
            let end = parseFloat($(`#vas-seg_${ parseInt(sno, 2) }`).css('left')) + $(`#vas-seg_${ parseInt(sno, 2) }`).width();

            relativeVasPos = end - diff - 6; //Extra 5 accounts for width of the element showing position 
        } else {
            //If positive
            //relativeVasPos += 6;
        }
        
        $('#vas-area').append(`
        <div class="translate-seg seg" id="vas-translate_${ parseInt(sno, 2) }" style="left: ${ relativeVasPos }; width: 5px; background-color: lightblue; z-index: 7;">
            <!-- <div class="seg-identifier">${ binary(sno, 2) }</div> -->
        </div>
        `);
    }

    //Checks bounds within the PAS
    checkBounds(s) {
        let start = s.direction === 'Positive' ? parseInt(s.base) : parseInt(s.base) - parseInt(s.size);
        let end = start + parseInt(s.size);
        let size = Math.pow(2, parseInt(this.pLength));

        for (let segno in this.segments.items) {
            if (parseInt(segno) === parseInt(s.number))
                continue;

            let seg = this.segments.items[segno]
            let seg_start = seg.direction === 'Positive' ? parseInt(seg.base) : parseInt(seg.base) - parseInt(seg.size);
            let seg_end = seg_start + parseInt(seg.size);

            if (start < seg_end && seg_start < end) {
                    return {
                        result: false,
                        msg: `Segment ${ binary(s.number, 2) } bounds overlaps with segment ${ binary(seg.number, 2) }`
                    }
            }

            if (end > size || start > size) {
                return {
                    result: false,
                    msg: `Segment ${ binary(s.number, 2) } goes beyond length of address space`
                }
            }
        }

        if (parseInt(s.size) > Math.pow(2, parseInt(this.vLength) - 2)) {
            return {
                result: false,
                msg: `Segment ${ binary(s.number, 2) } is larger than your virtual address allows.\n
                VA Length: ${ parseInt(this.vLength) - 2 }\n
                VA Size: ${ Math.pow(2, parseInt(this.vLength) - 2) }\n
                Segment Size: ${ s.size }
                `
            }
        }

        return {
            result: true,
            msg: `Segment ${ binary(s.number, 2) } fits within bounds`
        };
    }

    //Sometimes people like to change the size of the screen... grrr
    handleResize() {
        this.drawAxis();
        this.drawSegments();
    }
};

function binary(num, length) {
    let bi = num.toString(2);
    
    if (length && length > bi.length)
        bi = new Array(length - bi.length + 1).join('0') + bi;

    return bi;
}

function hex(num) {
    return num.toString(16);
}