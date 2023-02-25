/*
    Miro Manestar
    Segmentation Simulator
    CPTR-365 | Operating Systems | Professor Robert Ordonez
    May 5, 2021
*/

$(document).ready(function() {
    sim = new Sim();
    sim.reset();
});

var sim = class {};

var Sim = class {
    constructor() {
        this.segments = { 
            length: 0, 
            nextSegmentNo: 0, //Does nothing for now
            items: {} 
        }

        this.toastCount = 0;
        window.addEventListener('resize', ev => {
            if (ev.origin !== window.location.host)
                this.handleResize();
        });

        //The max number of segments allowed
        this.vasSize = 4;
    }

    createSegment(name, base, size, direction, num) {
        let number = num || this.segments.nextSegmentNo;
        let segment = {
            name: name,
            number: number,
            base: base,
            size: size,
            direction: direction
        }

        let check = this.validateSeg(segment);
        if (!check.result && check.error !== 'IS_EMPTY') {
            this.toast(check.msg, 'error');
            return;
        }

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

        $('#seg-table tbody').append(`
        <tr id="seg-table_${ number }">
            <td>${ name }</td>
            <td>${ binary(number, 2) }</td>
            <td><input id="base-input_${ number }" value="${ base }" type="number" min="0" class="minimal-input" onchange="sim.changeBase(${ number }, $(this).val());" placeholder="Base" /></td>
            <td><input id="size-input_${ number }" value="${ size }" type="number" min="0" class="minimal-input" onchange="sim.changeSize(${ number }, $(this).val());" placeholder="Size" /></td>
            <td>
                <select class="select-css" name="segment-direction" onchange="sim.changeDir(${ number }, $(this).val());" id="dir-input_${ number }">
                    <option>Positive</option>
                    <option ${ direction === 'Negative' ? 'selected' : '' }>Negative</option>
                </select>
            </td>
        </tr>
        `);

        this.segments.items[number] = segment

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

            let check = this.validateSeg(this.segments.items[sno]);

            if (check.result) {
                this.drawSegments();
            } else if (check.error !== 'IS_EMPTY') {
                this.toast(check.msg, 'error');
                $(`#base-input_${ sno }`).val(temp)
                this.segments.items[sno].base = temp;
            }
        } else {
            this.segments.items[sno].base = undefined;
            let check = this.validateSeg(this.segments.items[sno]);
            if (!check.result)
                this.hideSeg(sno);
        }
    }

    changeSize(sno, size) {
        if (size) {
            let temp = this.segments.items[sno].size;
            this.segments.items[sno].size = size;

            let check = this.validateSeg(this.segments.items[sno]);
            
            if (check.result) {
                this.drawSegments();
                
                //Determine the minimum viable VA length now 
                this.vLengthMin = 0;
                for (let s in this.segments.items) {
                    let seg = this.segments.items[s];
                    let bitSize = (parseInt(seg.size) - 1).toString(2).length;
                    if (bitSize > this.vLengthMin) {
                        this.vLengthMin = bitSize;
                    }
                }
                
                //Now let's determine the percentage a gradient could be to give user feedback for max/min of VA length
                let gradPercent = (parseInt(this.vLength) - (parseInt(this.vLengthMin) + 2)) / (parseInt(this.pLength) - (parseInt(this.vLengthMin) + 2));
                $('#vas-progress-bar').width(`${ gradPercent * 100 }%`);
                console.log(this.vLengthMin)
                
            } else if (check.error !== 'IS_EMPTY') {
                this.toast(check.msg, 'error');
                $(`#size-input_${ sno }`).val(temp)
                this.segments.items[sno].size = temp;
            }
        } else {
            this.segments.items[sno].size = undefined;
            let check = this.validateSeg(this.segments.items[sno]);
            if (!check.result)
                this.hideSeg(sno);
        }
    }

    changeDir(sno, dir) {
        if (dir) {
            let temp = this.segments.items[sno].direction;
            this.segments.items[sno].direction = dir;

            let check = this.validateSeg(this.segments.items[sno]);

            if (check.result) {
                this.drawSegments();
            } else {
                this.toast(check.msg, 'error');
                $(`#dir-input_${ sno }`).val(temp)
                this.segments.items[sno].direction = temp;
            }
        }
    }

    hideSeg(sno) {
        $(`#vas-seg_${ sno }, #pas-seg_${ sno }`).width(0);
        $(`#vas-seg_${ sno } .seg-identifier, #pas-seg_${ sno } .seg-identifier`).css('font-size', '0');
        setTimeout(() => {
            $(`#vas-seg_${ sno }, #pas-seg_${ sno }`).hide();
        }, 300);
    }

    drawSegments() {
        for (let s in this.segments.items)
            this.drawSegment(this.segments.items[s]);
        this.translateAddress($('#translation-input').val(), true); //The true silences alerts from the function
    }

    drawSegment(s) {
        this.pSegment(s);
        this.vSegment(s);
    }

    pSegment(s) {
        if (!this.pLength) {
            $(`#pas-seg_${ s.number }`).remove();
            return;
        }
        
        let length = $('#pas-area').width();

        let size = Math.pow(2, this.pLength);
        let relativePos = (s.base / size) * length;
        let relativeSize = (s.size / size) * length;

        let shouldRender = true;
        if (isNaN(relativeSize)|| isNaN(relativePos)) {
            relativeSize = 0;
            relativePos = 0;
            shouldRender = false;
        }

        let style = `
            left: ${ s.direction !== 'Negative' ? relativePos : relativePos - relativeSize }; 
            width: ${ relativeSize };
            background-color: ${ s.direction !== 'Negative' ? 'blue' : 'red' };
        `;

        $(`#pas-seg_${ s.number }`).show();
        if ($(`#pas-seg_${ s.number }`).length) {
            $(`#pas-seg_${ s.number }`).attr('style', style);
        } else {
            $('#pas-area').append(`
            <div class="seg" id="pas-seg_${ s.number }" style="${ style }">
                <div class="seg-identifier">${ binary(s.number, 2) }</div>
            </div>
            `);
        }

        if (!shouldRender)
            $(`#pas-seg_${ s.number }`).hide();

        $(`#pas-seg_${ s.number } .seg-identifier`).css('font-size', '');
        setTimeout(function() {
            fitty(`#pas-seg_${ s.number } .seg-identifier`, { maxSize: 45 });
        }, 120);
    }

    //Draws segments in the virtual address space
    vSegment(s) {
        if (!this.vLength) {
            $(`#vas-seg_${ s.number }`).remove();
            return;
        }

        let length = $('#vas-area').width();

        let realPos = (s.number * .25) * this.vasSize;
        let relativePos = (realPos / this.vasSize) * length;
        
        //Calculates the space between each "segment" grid in the VAS and figures the relative size of each virtual segment
        let nextRelativePos;
        let calcRelSize = () => {
            let nextPos = ( (s.number + 1) * .25) * this.vasSize;
            nextRelativePos = (nextPos / this.vasSize) * length;

            let actualWidth = nextRelativePos - relativePos;
            let widthRatio = parseInt(s.size) / Math.pow(2, parseInt(this.vLength) - 2);
            return actualWidth * widthRatio;
        };

        let relativeSize = calcRelSize();

        let shouldRender = true;
        if (isNaN(relativeSize)|| isNaN(relativePos)) {
            relativeSize = 0;
            relativePos = 0;
            shouldRender = false;
        }

        let style = `
            left: ${ s.direction !== 'Negative' ? relativePos : nextRelativePos - relativeSize }; 
            width: ${ relativeSize };
            background-color: ${ s.direction !== 'Negative' ? 'blue' : 'red' };
        `;
        
        $(`#vas-seg_${ s.number }`).show();
        if ($(`#vas-seg_${ s.number }`).length) {
            $(`#vas-seg_${ s.number }`).attr('style', style);
        } else {
            $('#vas-area').append(`
            <div class="seg" id="vas-seg_${ s.number }" style="${ style }">
                <div class="seg-identifier">${ binary(s.number, 2) }</div>
            </div>
            `);
        }

        if (!shouldRender)
            $(`#vas-seg_${ s.number }`).hide();

        $(`#vas-seg_${ s.number } .seg-identifier`).css('font-size', '');
        setTimeout(function() {
            fitty(`#vas-seg_${ s.number } .seg-identifier`, { maxSize: 45 });
        }, 120);
    }

    drawAxis() {
        this.pAxis();
        this.vAxis();
    }

    pAxis() {
        if (this.pLength) {
            $('#pas-area .mem-null').hide();
        } else {
            $('#pas-area .mem-null').show();
            $('#pas-area .sim-axis, #pas-area .axis-separator').remove();
            return;
        }

        let length = $('#pas-area').width();

        let size = Math.pow(2, this.pLength);

        for (let i = 0; i <= 8; i++) {
            let realPos = (i * .125) * size;
            let relativePos = (realPos / size) * length;
            let rawRelativePos = relativePos

            let style = `left: ${ relativePos - 6 };`;
            if (i === 0)
                style = `left: ${ relativePos + 3 };`;
            else if (i === 8)
                style = `right: ${ 5 };`;
            else
                style = `left : ${ relativePos - ((realPos.toString().length - 1) * 5.5) }`

            if ($(`#pas-axis_${ i }`).length) {
                $(`#pas-axis_${ i }`).attr('style', style).html(Math.round(realPos));
            } else {
                $('#pas-area').append(`
                <div class="sim-axis" id="pas-axis_${ i }" style="${ style };">${ Math.round(realPos) }</div>
                `);
            }

            if( $(`#pas-separator_${ i }`).length) {
                $(`#pas-separator_${ i }`).css('left', i !== 8 ? rawRelativePos : rawRelativePos - 3);
            } else {
                $('#pas-area').append(`
                <div class="axis-separator" id="pas-separator_${ i }" style="left: ${ i !== 8 ? rawRelativePos : rawRelativePos - 3 }"></div>
                `);
            }
        }
    }

    //Draw the virtual address space axis
    vAxis() {
        if (this.vLength) {
            $('#vas-area .mem-null').hide();
        } else {
            $('#vas-area .mem-null').show();
            $('#vas-area .sim-axis, #vas-area .axis-separator').remove();
            return;
        }

        let length = $('#vas-area').width();

        for (let i = 0; i <= 4; i++) {
            let realPos = (i * .25) * this.vasSize;
            let relativePos = (realPos / this.vasSize) * length;
            let rawRelativePos = relativePos;
            let axisValue = i * Math.pow(2, parseInt(this.vLength - 2));

            let style = `left: ${ relativePos - 6 };`;
            if (i === 0)
                style = `left: ${ relativePos + 3 };`;
            else if (i === 4)
                style = `right: ${ 5 };`;
            else
                style = `left : ${ relativePos - ((axisValue.toString().length - 1) * 5.5) }`

            if ($(`#vas-axis_${ i }`).length) {
                $(`#vas-axis_${ i }`).attr('style', style).html(axisValue);
            } else {
                $('#vas-area').append(`
                <div class="sim-axis" id="vas-axis_${ i }" style="${ style }">${ axisValue }</div>
                `);
            }

            if( $(`#vas-separator_${ i }`).length) {
                $(`#vas-separator_${ i }`).css('left', i !== 4 ? rawRelativePos : rawRelativePos - 3);
            } else {
                $('#vas-area').append(`
                <div class="axis-separator" id="vas-separator_${ i }" style="left: ${ i !== 4 ? rawRelativePos : rawRelativePos - 3 };"></div>
                `);
            }
        }
    }

    //Sets the length of the physical address in bits
    setPas(num) {
        if (parseInt(num) < parseInt(this.vLength) + 1) {
            this.toast('Your physical address length must be greater than your virtual address length', 'error');
            $('#pas-input').val(this.pLength);
            return;
        }
        
        //Now let's determine the percentage a gradient could be to give user feedback for max/min of VA length
        let gradPercent = (parseInt(this.vLength) - (parseInt(this.vLengthMin) + 2)) / (parseInt(num) - (parseInt(this.vLengthMin) + 2));
        $('#vas-progress-bar').width(`${ gradPercent * 100 }%`);

        this.pLength = num;
        this.pAxis();
        this.drawSegments();
    }

    //Sets the length of the virtual address in bits
    setVas(num) {
        if (!this.pLength) {
            this.toast('Please set a physical address length', 'error');
            $('#vas-input').val(this.vLength);
            return;
        } else if (num === '') { 
            this.vLength = num;
            $('#vas-progress-bar').width(0);
            this.vAxis();
            this.drawSegments();
            return;
        } else if (num && parseInt(num) > parseInt(this.pLength)) {
            this.toast(`Your VA length should be less than or equal to your PA length`, 'error');
            $('#vas-input').val(this.vLength);
            return;
        } else if (num <= 2) {
            this.toast(`Your VA length must be greater than 2 (Because the first two bits are used to identify segment)`, 'error');
            $('#vas-input').val(this.vLength);
            return;
        }

        //Find the minimum amount of bits allowed to fit segment within bounds of a segment space, set as lower bound of gradient
        this.vLengthMin = 0;
        let tempSeg = 0; //The segment which has been identified as the biggest segment
        for (let s in this.segments.items) {
            let seg = this.segments.items[s];
            let bitSize = (parseInt(seg.size) - 1).toString(2).length;
            if (bitSize > this.vLengthMin) {
                this.vLengthMin = bitSize;
                tempSeg = seg;
            }
        }
        
        //Now let's determine the percentage a gradient could be to give user feedback for max/min of VA length
        let gradPercent = (parseInt(num) - (parseInt(this.vLengthMin) + 2)) / (parseInt(this.pLength) - (parseInt(this.vLengthMin) + 2));
        $('#vas-progress-bar').width(`${ gradPercent * 100 }%`);


        //Total size (in bytes) of a virtual segment
        let vSize = Math.pow(2, parseInt(num) - 2);
        if (gradPercent < 0) {
            this.toast(`Segment ${ binary(tempSeg.number, 2) } is larger than your virtual address allows. <br />
            Max  Segment Size: ${ vSize } <br />
            Segment Size: ${ tempSeg.size }
            `, 'error')
            $('#vas-input').val(this.vLength);
            return;
        }

        this.vLength = num;
        this.vAxis();
        this.drawSegments();
    }

    //Translates a virtual address into a physical address and highlights the appropriate segments to show intersections
    translateAddress(num, isSilent) {
        if (!this.vLength) {
            if (!isSilent) {
                this.toast('You must enter a virtual address length', 'error')
                $('#translation-input').val('');
            }

            return;
        }

        if (num === '') {
            $('#translated-address').html('<span class="text-warning">N/A</span>');
            $('#seg-table tr').removeClass('selected-seg');
            $('.seg').removeClass('selected-seg');
            $('.translate-seg').remove();
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
            this.drawTranslatedAddress(sno, offset, num);
        } catch (e) {
            $('#translated-address').html('<span class="text-danger">Segfault</span>');
            $('#seg-table tr').removeClass('selected-seg');
            $('.seg').removeClass('selected-seg');
            return;
        }

        $(`#seg-table_${ parseInt(sno, 2) }`).addClass('selected-seg');

        $(`#vas-seg_${ parseInt(sno, 2) }`).addClass('selected-seg');
        $(`#pas-seg_${ parseInt(sno, 2) }`).addClass('selected-seg');

        this.lastSelectedSegment = sno;
    }

    drawTranslatedAddress(sno, offset, fullVAddress) {
        let vMemSize = parseInt(Math.pow(2, parseInt(this.vLength)));
        //Throw an error if the virtual address is outside the bounds of the VA space
        if (fullVAddress < 0 || fullVAddress > vMemSize) {
            throw new Error('The virtual address is outside the bounds of the virtual address space');
        }

        //Draw the "translated" address within the PAS
        let base, size, dir;
        try {
            base = parseInt(this.segments.items[parseInt(sno, 2)].base)
            size = parseInt(this.segments.items[parseInt(sno, 2)].size)
            dir = this.segments.items[parseInt(sno, 2)].direction;
        } catch(e) {}

        //The physical address given the virtual address
        //When negative, using base - offset instead of base - size + offset causes the virtual address to be mapped negatively to negatively growing segments.
        let pAddress = dir === 'Positive' ? base + offset : (base - size + offset) - (vMemSize/4 - size);
        let relativePasPos = pAddress / Math.pow(2, parseInt(this.pLength)) * $('#pas-area').width();
        let relativeVasPos = fullVAddress / vMemSize * $('#vas-area').width();

        //Throw an error an exit function if the translated address is outside the bounds of a segment's physical bounds
        if ( (dir === 'Positive' ? pAddress >= base + size : pAddress < base - size) || !base) {
            //As per ProfO's request, draw the translated address with a different color if segfault in the VAS
            if ($('#vas-area .translate-seg').length) {
                $('#vas-area .translate-seg').css('left', relativeVasPos).addClass('segfault');
            } else {
                $('#vas-area').append(`
                <div class="translate-seg segfault seg" id="vas-translate_${ parseInt(sno, 2) }" style="left: ${ relativeVasPos };">
                    <!-- <div class="seg-identifier">${ binary(sno, 2) }</div> -->
                </div>
                `);
            }
            $('#pas-area .translate-seg').remove();
            throw new Error('pAddress out of bounds of a physical address');
        }

        $('#translated-address').html(`<span class="text-info">${ pAddress }</span>`);

        if ($('#pas-area .translate-seg').length) {
            $('#pas-area .translate-seg').css('left', relativePasPos);
        } else {
            $('#pas-area').append(`
            <div class="translate-seg seg" id="pas-translate_${ parseInt(sno, 2) }" style="left: ${ relativePasPos };">
                <!-- <div class="seg-identifier">${ binary(sno, 2) }</div> -->
            </div>
            `);
        }

        if ($('#vas-area .translate-seg').length) {
            $('#vas-area .translate-seg').css('left', relativeVasPos).removeClass('segfault');
        } else {
            $('#vas-area').append(`
            <div class="translate-seg seg" id="vas-translate_${ parseInt(sno, 2) }" style="left: ${ relativeVasPos };">
                <!-- <div class="seg-identifier">${ binary(sno, 2) }</div> -->
            </div>
            `);
        }
    }

    //Does all the checks required for slapping the user if they try to do something mentally deficient when entering segment inputs
    //Returns an object with a boolean result and a custom message.
    validateSeg(s) {
        //If either the size, base, or direction of the segment is empty, then it doesn't even exist
        if (!s.size || !s.base || !s.direction) {
            return {
                result: false,
                msg: `Segment ${ s.number } has one or more empty inputs and therefore will not be rendered.`,
                error: 'IS_EMPTY'
            };
        }

        //Variables for determining the actual address range of segments in the PAS
        let start = s.direction === 'Positive' ? parseInt(s.base) : parseInt(s.base) - parseInt(s.size);
        let end = start + parseInt(s.size);

        //Calculates the total size of the PAS
        let size = Math.pow(2, parseInt(this.pLength));

        //The base and size of a segment must be whole numbers
        if (!Number.isInteger(parseInt(s.size))) {
            return {
                result: false,
                msg: `Size must be a whole number`,
                error: 'IS_DECIMAL'
            };
        }

        if (!Number.isInteger(parseInt(s.base))) {
            return {
                result: false,
                msg: `Base must be a whole number`,
                error: 'IS_DECIMAL'
            };
        }

        //The base and size cannot be negative
        if (parseInt(s.size) < 0) {
            return {
                result: false,
                msg: `Size must be 0 or greater`,
                error: 'IS_NEGATIVE'
            };
        }

        if (parseInt(s.base) < 0) {
            return {
                result: false,
                msg: `Base must be 0 or greater`,
                error: 'IS_NEGATIVE'
            };
        }

        for (let segno in this.segments.items) {
            //Must ignore the segment currently being modified
            if (parseInt(segno) === parseInt(s.number))
                continue;

            let seg = this.segments.items[segno]
            let seg_start = seg.direction === 'Positive' ? parseInt(seg.base) : parseInt(seg.base) - parseInt(seg.size);
            let seg_end = seg_start + parseInt(seg.size);

            //Determining whether the new inputs of a segment overlap with another existing segment within the PAS
            if (start < seg_end && seg_start < end) {
                    return {
                        result: false,
                        msg: `Segment ${ binary(s.number, 2) } bounds overlaps with segment ${ binary(seg.number, 2) }`,
                        error: 'SEGMENT_OVERLAP'
                    };
            }

            //A segment cannot go beyond the bounds of the PAS
            if (end > size || start > size) {
                return {
                    result: false,
                    msg: `Segment ${ binary(s.number, 2) } goes beyond length of address space`,
                    error: 'OUTSIDE_BOUNDS'
                };
            }
        }

        //The size of a segment cannot be greater than the max offset per segment, size per segment is 2^(vLength - 2)
        if (parseInt(s.size) > Math.pow(2, parseInt(this.vLength) - 2)) {
            return {
                result: false,
                msg: `Segment ${ binary(s.number, 2) } is larger than your virtual address allows. <br />
                Max Segment Size: ${ Math.pow(2, parseInt(this.vLength) - 2) } <br />
                Segment Size: ${ s.size }
                `,
                error: 'OUTSIDE_OFFSET'
            };
        }

        return {
            result: true,
            msg: `Segment ${ binary(s.number, 2) } is valid`,
            error: 'NONE'
        };
    }

    //Sometimes people like to change the size of the screen... grrr
    handleResize() {
        this.drawAxis();
        this.drawSegments();
    }

    reset() {
        $('#seg-table').empty();
        this.segments = { 
            length: 0, 
            nextSegmentNo: 0, //Does nothing for now
            items: {} 
        };

        try {
            if (!localStorage.getItem('simDefaults')) {
                this.createSegment('Code', 1024, 250, 'Positive', 0);
                this.createSegment('Heap', 1274, 200, 'Positive', 1);
                this.createSegment('Stack', 1536, 62, 'Negative', 2);
                this.createSegment('Extra', undefined, undefined, 'Positive', 3);
        
        
                $('#pas-input').val(12).change();
                $('#vas-input').val(10).change();
                this.toast('Successfully loaded defaults', 'success');
            } else {
                let defaults = JSON.parse(localStorage.getItem('simDefaults'));
                for (let segno in defaults.segments.items) {
                    let seg = defaults.segments.items[segno];
                    this.createSegment(seg.name, seg.base, seg.size, seg.direction, seg.number);
                }

                $('#pas-input').val(defaults.pLength).change();
                $('#vas-input').val(defaults.vLength).change();
                $('#translation-input').val(defaults.translatedAddress).trigger('oninput');
                this.toast('Successfully loaded user defaults', 'success');
            }
        } catch (e) {
            this.createSegment('Code', 1024, 250, 'Positive', 0);
            this.createSegment('Heap', 1274, 200, 'Positive', 1);
            this.createSegment('Stack', 1536, 62, 'Negative', 2);
            this.createSegment('Extra', undefined, undefined, 'Positive', 3);
    
    
            $('#pas-input').val(12).change();
            $('#vas-input').val(10).change();

            this.toast('Unable to load user defaults', 'error');
            console.error(e);
        }
    }

    setDefaults() {
        try {
            localStorage.setItem('simDefaults', JSON.stringify({
                pLength: this.pLength,
                vLength: this.vLength,
                translatedAddress: $('#translation-input').val(),
                segments: this.segments
            }));
        } catch (e) {
            this.toast('Unable to set user defaults', 'error');
            console.error(e);
            return;
        }

        this.toast('Successfully set user defaults', 'success');
    }

    toast(msg, type) {
        let color = 'bg-primary';
        if (type === 'error')
            color = 'bg-danger'
        else if (type === 'success')
            color = 'bg-success'
        
        const toast = `
        <div class="toast align-items-center text-white ${ color } border-0" role="alert" aria-live="assertive" aria-atomic="true" id="toast_${ this.toastCount }">
            <div class="d-flex">
            <div class="toast-body">
                ${ msg }
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
        `;

        $('.toast.hide').remove();
        $('.toast-container').prepend(toast);
        $('.toast').toast('show');
        $(`#toast_${ this.toastCount - 3 }`).fadeOut('slow', function() { $(this).remove(); });
        this.toastCount++;
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
