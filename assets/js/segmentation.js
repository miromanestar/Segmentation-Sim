$(document).ready(function() {
    sim = new Sim();
});

var sim = class {};

var Sim = class {
    constructor() {
        this.segments = { 
            length: 0, 
            nextSegmentNo: 0, //Does nothing for now
            items: {} 
        }

        this.drawAxis();

        $('.vas-null').remove();
        //Create the 3 default segments
        this.createSegment('Code', 8_000, 2_000, 'Positive', 0);
        this.createSegment('Stack', 10_000, 2_000, 'Positive', 1);
        this.createSegment('Heap', 16_000, 2_000, 'Negative', 3);


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
            <td><input id="base-input_${ number }" value="${ base }" type="number" min="0" class="minimal-input" oninput="sim.changeBase(${ number }, $(this).val());" placeholder="Base" style="width: 150px;" /></td>
            <td><input id="size-input_${ number }" value="${ size }" type="number" min="0" class="minimal-input" oninput="sim.changeSize(${ number }, $(this).val());" placeholder="Size" style="width: 150px;" /></td>
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
            let temp = this.segments.items[sno];
            this.segments.items[sno].base = base;

            let check = this.checkBounds(this.segments.items[sno]);

            if (check.result) {
                $(`#pas-seg_${ sno }`).remove();
                this.pSegment(this.segments.items[sno]);
            } else {
                alert(check.msg);
                this.segments.items[sno] = temp;
            }
        }
    }

    changeSize(sno, size) {
        if (size) {
            let temp = this.segments.items[sno];
            this.segments.items[sno].size = size;

            let check = this.checkBounds(this.segments.items[sno]);

            if (check.result) {
                $(`#pas-seg_${ sno }`).remove();
                this.pSegment(this.segments.items[sno]);
            } else {
                alert(check.msg);
                this.segments.items[sno] = temp;
            }
        }
    }

    changeDir(sno, dir) {
        if (dir) {
            let temp = this.segments.items[sno];
            this.segments.items[sno].direction = dir;

            let check = this.checkBounds(this.segments.items[sno]);

            if (check.result) {
                $(`#pas-seg_${ sno }, #vas-seg_${ sno }`).remove();
                this.pSegment(this.segments.items[sno]);
                this.vSegment(this.segments.items[sno])
            } else {
                alert(check.msg);
                this.segments.items[sno] = temp;
            }
        }
    }

    drawSegments() {
        $('.memory-area .seg').remove();
        for (let s in this.segments.items)
            this.drawSegment(this.segments.items[s]);
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
        let length = $('#vas-area').width();

        let vasSize = 4;
        let realPos = (s.number * .25) * vasSize;
        let relativePos = (realPos / vasSize) * length;
        
        //Calculates the space between each "segment" grid in the VAS
        let calcRelSize = () => {
            let nextPos = ( (s.number + 1) * .25) * vasSize;
            let nextRelativePos = (nextPos / vasSize) * length;



            return nextRelativePos - relativePos;
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

        for (let i = 0; i <= 9; i++) {
            let realPos = (i * .1) * size;
            let relativePos = (realPos / size) * length;

            if (i === 0)
                relativePos += 15;
            else if (i === 10)
                relativePos -= 50;

            $('#pas-area').append(`
                <div class="sim-axis" style="left: ${ relativePos - 6 };">${ Math.round(realPos) }</div>
            `);
        }
    }

    //Draw the virtual address space axis
    vAxis() {
        $('#vas-area .sim-axis, #vas-area .axis-separator').remove();

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
        } else if (num && parseInt(num) + 1 > parseInt(this.pLength)) {
            alert(`Your VA length should be less than your PA length\nVA Length: ${ num }`);
            $('#vas-input').val(this.vLength);
            return;
        }
        
        this.vLength = num;
    }

    //Translates a virtual address into a physical address and highlights the appropriate segments to show intersections
    translateAddress(num) {
        if (!this.vLength) {
            alert('You must enter a virtual address length');
            $('#translation-input').val('');
            return;
        }

        num = parseInt(num);
        let bi = binary(num, this.vLength);

        let sno = bi.substr(0, 2);
        console.log(sno);
    }

    //Checks bounds within the PAS
    checkBounds(s) {
        let start = s.direction === 'Positive' ? s.base : s.base - s.size;
        let end = start + s.size;
        let size = Math.pow(2, this.pLength);

        for (let segno in this.segments.items) {
            if (parseInt(segno) === parseInt(s.number))
                continue;

            let seg = this.segments.items[segno]
            let seg_start = seg.direction === 'Positive' ? seg.base : seg.base - seg.size;
            let seg_end = seg_start + seg.size;

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