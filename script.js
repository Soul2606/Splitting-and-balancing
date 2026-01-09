




function is_css_grid_overlapping(element1, element2) {
	const column_start1 = Number(element1.style.gridColumnStart);
	const column_end1 = Number(element1.style.gridColumnEnd);
	const row_start1 = Number(element1.style.gridRowStart);
	const row_end1 = Number(element1.style.gridRowEnd);

	const column_start2 = Number(element2.style.gridColumnStart);
	const column_end2 = Number(element2.style.gridColumnEnd);
	const row_start2 = Number(element2.style.gridRowStart);
	const row_end2 = Number(element2.style.gridRowEnd);

	// Check if the elements overlap
	const columns_overlap = column_start1 < column_end2 && column_end1 > column_start2
	const rows_overlap = row_start1 < row_end2 && row_end1 > row_start2

	return columns_overlap && rows_overlap
}




function is_css_grid_overlapping_primitive(column_start1,column_end1,row_start1,row_end1,column_start2,column_end2,row_start2,row_end2) {

	// Check if the elements overlap
	const columns_overlap = column_start1 < column_end2 && column_end1 > column_start2
	const rows_overlap = row_start1 < row_end2 && row_end1 > row_start2

	return columns_overlap && rows_overlap
}




function insert_child_at_index(parent, newChild, index) {
	const children = parent.children;
	if (index >= children.length) {
		// Append to the end if the index is out of bounds
		parent.appendChild(newChild);
	} else {
		parent.insertBefore(newChild, children[index]);
	}
}




function prevent_overlap(elements_tracked, static_elements){
	let something_moved = true
	while (something_moved) {	
		something_moved = false	
		for(const element of elements_tracked){
			if (Array.isArray(static_elements)) {					
				if (static_elements.some(static_element=>static_element === element)){
					continue
				}
			}
			if (elements_tracked.some(element2=>is_css_grid_overlapping(element,element2) && element !== element2)){
				const newGridRowStart = Number(element.style.gridRowStart) + 1
				const newGridRowEnd = Number(element.style.gridRowEnd) + 1
				element.style.gridRowStart = newGridRowStart
				element.style.gridRowEnd = newGridRowEnd
				something_moved = true
			}
		}
	}
}





const main_grid = document.getElementById('main-grid')

const all_loop_back_elements_and_target = []

const add_input_lane_button = document.getElementById('add-input-lane-button')

const add_balancer_button = document.getElementById('add-balancer-button')
const add_loop_back_button = document.getElementById('add-loop-back-button')

let can_drag = true
let amount_of_input_lanes = 0

const PHI = 1.618033988749




const all_balancer_element_managers = []

class Balancer_element_manager {
	constructor(root_balancer_element, flow_visualizer_element_in_a, flow_visualizer_element_in_b, flow_visualizer_element_out_a, flow_visualizer_element_out_b, balancer_class_instance) {
		this.root_balancer_element = root_balancer_element
		this.flow_visualizer_element_in_a = flow_visualizer_element_in_a
		this.flow_visualizer_element_in_b = flow_visualizer_element_in_b
		this.flow_visualizer_element_out_a = flow_visualizer_element_out_a
		this.flow_visualizer_element_out_b = flow_visualizer_element_out_b
		this.balancer_class_instance = balancer_class_instance
		this.flow_visualizer_element_in_a_previous_color = 'black'
		this.flow_visualizer_element_in_b_previous_color = 'black'
		this.flow_visualizer_element_out_a_previous_color = 'black'
		this.flow_visualizer_element_out_b_previous_color = 'black'
	}

	animate_flow_visualizers(transfer_chain_info){
		transfer_chain_info.chain.forEach(element=>{
			const successfully_transferred = element.success
			if (this.balancer_class_instance.input_dlvt_a === element.reference && successfully_transferred) {
				play_slide_animation(this.flow_visualizer_element_in_a, this.flow_visualizer_element_in_a_previous_color, random_color_seeded(Number(element.reference.value)), 0.5)
				this.flow_visualizer_element_in_a_previous_color = random_color_seeded(Number(element.reference.value))
			}
			if (this.balancer_class_instance.input_dlvt_b === element.reference && successfully_transferred) {
				play_slide_animation(this.flow_visualizer_element_in_b, this.flow_visualizer_element_in_b_previous_color, random_color_seeded(Number(element.reference.value)), 0.5)
				this.flow_visualizer_element_in_b_previous_color = random_color_seeded(Number(element.reference.value))
			}
			if (this.balancer_class_instance.output_dlvt_a === element.reference && successfully_transferred) {
				play_slide_animation(this.flow_visualizer_element_out_a, this.flow_visualizer_element_out_a_previous_color, random_color_seeded(Number(element.reference.value)), 0.5)
				this.flow_visualizer_element_out_a_previous_color = random_color_seeded(Number(element.reference.value))
			}
			if (this.balancer_class_instance.output_dlvt_b === element.reference && successfully_transferred) {
				play_slide_animation(this.flow_visualizer_element_out_b, this.flow_visualizer_element_out_b_previous_color, random_color_seeded(Number(element.reference.value)), 0.5)
				this.flow_visualizer_element_out_b_previous_color = random_color_seeded(Number(element.reference.value))
			}
		})
	}
}




function filter_function_for_tracing_lane_connections(element1, element2){
	if (element1 === element2) {
		return false
	}
	if (element1.classList.contains('loop-back')) {
		if (element1.classList.contains('loop-back-right')) {
			return is_css_grid_overlapping_primitive(element1.style.gridColumnStart, Number(element1.style.gridColumnStart)+1, element1.style.gridRowStart, element1.style.gridRowEnd, element2.style.gridColumnStart, element2.style.gridColumnEnd, element2.style.gridRowStart, element2.style.gridRowEnd)
		}else{
			return is_css_grid_overlapping_primitive(Number(element1.style.gridColumnEnd)-1, element1.style.gridColumnEnd, element1.style.gridRowStart, element1.style.gridRowEnd, element2.style.gridColumnStart, element2.style.gridColumnEnd, element2.style.gridRowStart, element2.style.gridRowEnd)
		}
	}else{
		return is_css_grid_overlapping_primitive(element1.style.gridColumnStart, Number(element1.style.gridColumnStart)+1, element1.style.gridRowStart, element1.style.gridRowEnd, element2.style.gridColumnStart, element2.style.gridColumnEnd, element2.style.gridRowStart, element2.style.gridRowEnd) ||
		is_css_grid_overlapping_primitive(Number(element1.style.gridColumnEnd)-1, element1.style.gridColumnEnd, element1.style.gridRowStart, element1.style.gridRowEnd, element2.style.gridColumnStart, element2.style.gridColumnEnd, element2.style.gridRowStart, element2.style.gridRowEnd)
	}
}




function grid_column_shift(shift_start, shift_end, element, min_span = 1){
	//This function is used to change the element's position on the grid and change the grid data to correlate with the elements grid position. 

	const element_column_start = Number(element.style.gridColumnStart)
	const element_column_end = Number(element.style.gridColumnEnd)

	console.log('sifting',shift_start,shift_end, 'element position:', element_column_start, element_column_end)
	if (element_column_start + shift_start < 1 || element_column_start + shift_start >= element_column_end - (min_span - 1)) {
		console.log('cancelled condition 1')
		return
	}
	if (element_column_end + shift_end <= element_column_start + min_span - 1) {
		console.log('cancelled condition 2')
		return
	}
	

	element.style.gridColumnStart = element_column_start + shift_start
	element.style.gridColumnEnd = element_column_end + shift_end

	prevent_overlap(Array.from(main_grid.children), [element])
}




function gird_row_shift(shift, element) {
	console.log('shifting_row', shift)
	
	const row_start = Number(element.style.gridRowStart)
	const row_end = Number(element.style.gridRowEnd)

	element.style.gridRowStart = row_start + shift
	element.style.gridRowEnd = row_end + shift


	const main_grid_children = Array.from(main_grid.children)

	//If shifting down, try shifting up the overlapping elements, if there is still overlap then undo and proceed as usual
	if (shift > 0) {		
		const overlapping_elements = main_grid_children.filter(child=>is_css_grid_overlapping(child,element)&&child!==element)

		
		if (overlapping_elements.length > 0) {
			overlapping_elements.forEach(element=>{
				const original_row_start = Number(element.style.gridRowStart)
				const original_row_end = Number(element.style.gridRowEnd)
				console.log(original_row_start ,original_row_end)
				element.style.gridRowStart = original_row_start - 1
				element.style.gridRowEnd = original_row_end - 1
				//If it is still overlapping with something after moving up, then undo the move
				if (main_grid_children.some(child=>is_css_grid_overlapping(child,element) && child !== element)) {
					element.style.gridRowStart = original_row_start
					element.style.gridRowEnd = original_row_end
				}
			})
		}
	}

	if (main_grid_children.some(child=>is_css_grid_overlapping(element,child) && element !== child)){
		prevent_overlap(main_grid_children, [element])
	}


}




function create_adjustable_grid_spanner(min_span = 1, class_name = '', functions_called_when_grid_shift) {
	const root = document.createElement('div')
	root.className = class_name
	root.classList.add('adjustable-spanner')
	root.style.gridColumn = `${1}/${min_span+1}`
	root.style.gridRow = `2/3`

	let row = 2
	const main_grid_children = Array.from(main_grid.children)
	while (main_grid_children.some(element=>is_css_grid_overlapping(root, element))) {
		row ++
		root.style.gridRow = `${row}/${row+1}`
	}


	const drag_button_container = document.createElement('div')
	drag_button_container.className = 'adjustable-spanner-button-container'
	root.appendChild(drag_button_container)


	const call_functions_with_parameter = (functions, parameter)=>{
		if (!Array.isArray(functions)) {
			return
		}
		if (functions.length === 0) {
			return
		}
		functions.forEach(function_element => {
			function_element(parameter)
		})
	}


	const drag_button_right = create_drag_button(100, mouse_position=>{
		if (mouse_position.x > 0) {
			grid_column_shift(0,1,root,min_span)
		}else{
			grid_column_shift(0,-1,root,min_span)
		}
		call_functions_with_parameter(functions_called_when_grid_shift, drag_button_right)
	})
	

	const drag_button_left = create_drag_button(100, mouse_position=>{
		if (mouse_position.x > 0) {
			grid_column_shift(1,0,root,min_span)
		}else{
			grid_column_shift(-1,0,root,min_span)
		}
		call_functions_with_parameter(functions_called_when_grid_shift, drag_button_left)
	})


	const drag_button_center = create_drag_button(100, mouse_position=>{
		if (mouse_position.y > 0) {
			gird_row_shift(1,root,min_span)
		}else{
			gird_row_shift(-1,root,min_span)
		}
		call_functions_with_parameter(functions_called_when_grid_shift, drag_button_center)
	})


	drag_button_container.appendChild(drag_button_left)
	drag_button_container.appendChild(drag_button_center)
	drag_button_container.appendChild(drag_button_right)

	return root
}




function create_drag_button(distance_threshold, function_attached, class_name = '') {

	if (typeof distance_threshold !== 'number' || typeof function_attached !== 'function' || typeof class_name !== 'string') {
		throw new Error("Invalid parameters: ", distance_threshold, function_attached);	
	}

	const root = document.createElement('div')
	root.className = class_name
	root.classList.add('drag-button')

	//Mouse down event
	root.addEventListener('mousedown', e=>{
		if (!can_drag) {
			return
		}
		e.preventDefault()
		let was_inside_threshold = false
		
		// Mouse move event
		const mouse_move_event = e=>{
			const rect = root.getBoundingClientRect()
			const element_center_position = {x:rect.left + rect.width / 2, y:rect.top + rect.height / 2}
			const mouse_position = {x:e.clientX,y:e.clientY}
			const distance = Math.sqrt((mouse_position.x - element_center_position.x)**2 + (mouse_position.y - element_center_position.y)**2)

			if (distance > distance_threshold) {
				if (was_inside_threshold) {	
					const relative_mouse_position_normalized = {x:(mouse_position.x - element_center_position.x) / distance_threshold, y:(mouse_position.y - element_center_position.y) / distance_threshold}
					function_attached(relative_mouse_position_normalized)
				}
				was_inside_threshold = false
			}else{
				was_inside_threshold = true
			}
		}
		window.addEventListener('mousemove', mouse_move_event)

		//Mouse up event
		const remove_event_listeners = ()=>{
			window.removeEventListener('mousemove', mouse_move_event)
			window.removeEventListener('mouseup', remove_event_listeners)
		}
		window.addEventListener('mouseup', remove_event_listeners)
	})
	return root
}




function trace_down(column_to_trace, start_trace_form_row, elements_tracked) {			
	console.log('trace down')
	const lowest_row = Math.max.apply(null, elements_tracked.map(element=>Number(element.style.gridRowEnd)))
	let row = start_trace_form_row
	while (row < lowest_row) {
		row++
		const fake_element = {style:{
			gridColumnStart:String(column_to_trace),
			gridColumnEnd:String(column_to_trace+1),
			gridRowStart:String(start_trace_form_row),
			gridRowEnd:String(row)
		}}
		const overlapping_elements = elements_tracked.filter(element=>{return filter_function_for_tracing_lane_connections(element, fake_element)})
		if (overlapping_elements.length > 0) {
			return overlapping_elements
		}
	}
	return []
}




function create_flow_visualizer(start_from_row, start_in_column, trace_up) {
	console.groupCollapsed('create flow visualizer')
	if (typeof start_from_row !== 'number' || typeof start_in_column !== 'number' || typeof trace_up !== 'boolean') {
		throw new Error("invalid parameters");
	}
	const all_adjustable_spanners = Array.from(main_grid.children).filter(element=>element.classList.contains('adjustable-spanner'))
	const flow_visualizer = create_flow_visualizer_line(start_in_column, start_from_row, start_from_row)
	console.log('start_from_row:',start_from_row, ' start_in_column:',start_in_column, ' trace_up:',trace_up)


	if (trace_up) {
		console.log('trace up')
		while (flow_visualizer.style.gridRowStart > 2) {
			flow_visualizer.style.gridRowStart = Number(flow_visualizer.style.gridRowStart) - 1
			const overlapping_elements = all_adjustable_spanners.filter(element=>{return filter_function_for_tracing_lane_connections(element, flow_visualizer)})
			if (overlapping_elements.length > 0) {
				flow_visualizer.style.gridRowStart = Number(flow_visualizer.style.gridRowStart) + 1
				console.log('overlap detected')
				break
			}
		}
	}else{
		const lowest_row = Math.max.apply(null, all_adjustable_spanners.map(element=>Number(element.style.gridRowEnd)))
		const hit_elements = trace_down(start_in_column, start_from_row, all_adjustable_spanners)
		if (hit_elements.length > 0) {
			flow_visualizer.style.gridRowEnd = hit_elements[0].style.gridRowStart
		}else{
			flow_visualizer.style.gridRowEnd = lowest_row
		}
	}
	console.log('loop done')
	console.log(flow_visualizer)
	if (flow_visualizer.style.gridRowStart === flow_visualizer.style.gridRowEnd) {
		flow_visualizer.style.display = 'none'
	}
	main_grid.appendChild(flow_visualizer)
	console.groupEnd()
	return flow_visualizer
}




function create_flow_visualizer_line(column, row_start, row_end) {
	const root = document.createElement('div')
	root.className = 'flow-visualizer'
	root.style.gridArea = `${row_start}/${column}/${row_end}/${column+1}`
	return root
}




setInterval(set_main_grid_width, 200)

function set_main_grid_width(){
	const main_grid_children = Array.from(main_grid.children)
	const grid_column_end = main_grid_children.map(element => {
		// Number(), parseInt(), Number.parseInt() these don't work for some reason but - 1 works?????????
		const width = (window.getComputedStyle(element).gridColumnEnd) - 1
		return isNaN(width)?0:width
	})
	let largest = Math.max(...grid_column_end)
	const column_width = 200
	const gap = 15
	const padding = 5
	main_grid.style.width = `${largest * column_width + (largest - 1) * gap + padding * 2}px`
}




add_input_lane_button.addEventListener('click', ()=>{
	const new_input_lane = document.createElement('div')
	new_input_lane.className = 'input-flow-display'
	new_input_lane.style.gridRow = '1/2'
	amount_of_input_lanes++
	new_input_lane.style.gridColumn = `${amount_of_input_lanes}/${amount_of_input_lanes + 1}`
	main_grid.appendChild(new_input_lane)
	new_input_lane.addEventListener('click', remove_input_lane)
})




function remove_input_lane(){
	const input_lanes_elements = Array.from(main_grid.children).filter(element=>element.className === 'input-flow-display')
	const last_input_lane = input_lanes_elements.filter(element=>element.style.gridColumnStart === String(amount_of_input_lanes))
	if (last_input_lane.length > 1) {
		console.warn('more than one last input lane')
	}
	if (last_input_lane.length > 0) {		
		last_input_lane[0].remove()
		amount_of_input_lanes--
	}else{
		console.warn('No last input lane to remove')
	}
}




add_balancer_button.addEventListener('click', ()=>{
	const balancer_element = create_adjustable_grid_spanner(2, 'balancer')

	balancer_element.setAttribute('data-out-disabled', 'none')
	const toggle_balancer_output = (element, right_side) => {
		element.classList.toggle('balancer-flow-display-disabled')
		const side = right_side ? 'right' : 'left'
		const isDisabled = element.classList.contains('balancer-flow-display-disabled')
		const newState = isDisabled ? side : 'none'
		balancer_element.setAttribute('data-out-disabled', newState)
	}


	let flow_visualizer_element_in_a
	let flow_visualizer_element_in_b
	let flow_visualizer_element_out_a
	let flow_visualizer_element_out_b
	const create_balancer_flow_display = (input, right_side)=>{
		const root = document.createElement('div')
		if (input) {
			root.className = 'balancer-flow-display-input'
		}else{
			root.className = 'balancer-flow-display-output'
			root.addEventListener('click', ()=>{toggle_balancer_output(root, right_side)})
		}
		let flow_visualizer
		root.addEventListener('mouseenter', ()=>{
			flow_visualizer = create_flow_visualizer(Number(input?balancer_element.style.gridRowStart:balancer_element.style.gridRowEnd), right_side?Number(balancer_element.style.gridColumnEnd)-1:Number(balancer_element.style.gridColumnStart), input)
		})
		root.addEventListener('mouseleave', ()=>{flow_visualizer.remove()})
		root.classList.add('balancer-flow-display')
		if (input) {
			if (right_side) {
				flow_visualizer_element_in_b = root
			}else{
				flow_visualizer_element_in_a = root
			}
		}else{
			if (right_side) {
				flow_visualizer_element_out_b = root
			}else{
				flow_visualizer_element_out_a = root
			}
		}
		return root
	}

	const create_balancer_flow_display_container = (input)=>{
		const root = document.createElement('div')
		root.className = 'balancer-flow-display-container'

		root.appendChild(create_balancer_flow_display(input, false))
		root.appendChild(create_balancer_flow_display(input, true))

		return root
	}

	const balancer_flow_display_container_top = create_balancer_flow_display_container(true)
	insert_child_at_index(balancer_element, balancer_flow_display_container_top, 0)
	
	const balancer_flow_display_container_bottom = create_balancer_flow_display_container(false)
	balancer_element.appendChild(balancer_flow_display_container_bottom)

	main_grid.appendChild(balancer_element)

	all_balancer_element_managers.push(new Balancer_element_manager(balancer_element, flow_visualizer_element_in_a, flow_visualizer_element_in_b, flow_visualizer_element_out_a, flow_visualizer_element_out_b))
})




add_loop_back_button.addEventListener('click', ()=>{


	const loop_back_target = document.createElement('div')
	loop_back_target.className = 'loop-back-target'


	const buttons_container_center = document.createElement('div')
	buttons_container_center.className = 'adjustable-spanner-buttons-container-center'

	const button_center_up = document.createElement('div')
	button_center_up.className = 'adjustable-spanner-button'
	button_center_up.addEventListener('click', ()=>{gird_row_shift(-1, loop_back_target)})
	buttons_container_center.appendChild(button_center_up)

	const button_center_down = document.createElement('div')
	button_center_down.className = 'adjustable-spanner-button'
	button_center_down.addEventListener('click', ()=>{gird_row_shift(1, loop_back_target)})
	buttons_container_center.appendChild(button_center_down)
	

	loop_back_target.appendChild(buttons_container_center)



	let loop_back

	const set_loop_back_target_position = element_that_called=>{
		if (loop_back.classList.contains('loop-back-right')) {			
			loop_back_target.style.gridColumnStart = Number(loop_back.style.gridColumnEnd) - 1
			loop_back_target.style.gridColumnEnd = Number(loop_back.style.gridColumnEnd)
		}else{
			loop_back_target.style.gridColumnStart = Number(loop_back.style.gridColumnStart)
			loop_back_target.style.gridColumnEnd = Number(loop_back.style.gridColumnStart) + 1
		}
		if (Number(loop_back_target.style.gridRowStart) >= Number(loop_back.style.gridRowStart)) {			
			loop_back_target.style.gridRowStart = Number(loop_back.style.gridRowStart) - 1
			loop_back_target.style.gridRowEnd = Number(loop_back.style.gridRowEnd) - 1
		}
		if (loop_back_target.style.gridRowStart === '1') {
			loop_back_target.style.gridRowStart = 2
			loop_back_target.style.gridRowEnd = 3
		}
		prevent_overlap(Array.from(main_grid.children), [loop_back_target])
	}
	
	loop_back = create_adjustable_grid_spanner(1, 'loop-back loop-back-right', [set_loop_back_target_position])

	loop_back_target.style.gridRowStart = Number(loop_back.style.gridRowStart) - 1
	loop_back_target.style.gridRowEnd = Number(loop_back.style.gridRowEnd) - 1
	
	const flip_loop_back = ()=>{
		if (loop_back.classList.contains('loop-back-right') && loop_back.classList.contains('loop-back-left')) {
			loop_back.classList.remove('loop-back-left')
		}else if(!loop_back.classList.contains('loop-back-right') && !loop_back.classList.contains('loop-back-left')){
			loop_back.classList.add('loop-back-right')
		}
		loop_back.classList.toggle('loop-back-right')
		loop_back.classList.toggle('loop-back-left')
	}
	const flip_button = document.createElement('div')
	flip_button.className = 'loop-back-flip-button adjustable-spanner-button'
	flip_button.addEventListener('click', flip_loop_back)
	flip_button.addEventListener('click', set_loop_back_target_position)
	insert_child_at_index(Array.from(loop_back.children)[0], flip_button, 2)


	main_grid.appendChild(loop_back)
	main_grid.appendChild(loop_back_target)
	all_loop_back_elements_and_target.push({element:loop_back, target:loop_back_target})

	set_loop_back_target_position()

})




function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}




async function play_slide_animation(element, color1, color2, time_seconds) {
	element.style.backgroundPosition = ''
	element.style.transition = `background-position 0s`
	element.style.setProperty('background-image', `linear-gradient(to bottom, ${color1} 48%, white 50%, ${color2} 52%)`)
	//This exists so the animation is repeatable
	await sleep(1)
	element.style.backgroundSize = '100% 200%'
	element.style.transition = `background-position ${time_seconds}s`
	element.style.backgroundPosition = '0 -100%'
}




function random_color_seeded(seed) {
	let hue = (seed*PHI*360+55)%360
	let saturation = (seed*PHI*50)%50 + 50
	let lightness = ((seed*PHI*20+10)%20) + 40
	if (seed = null) {
		lightness = 0
		saturation = 100
		hue = 0
	}
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}


 




/**
 * @typedef {object} PositionGrid
 * @property {number} row
 * @property {number} column
*/

/**
 * A single balancer extracted from the HTML grid.
 * A = left side, B = right side.
 *
 * @typedef {Object} BalancerNode
 * @property {string} id               Unique balancer ID, e.g. "b:0"
 * @property {number} row              The grid row where the balancer starts
 * @property {number} inputColA        Column index for left input
 * @property {number} inputColB        Column index for right input
 * @property {boolean} outputA         left output is enabled
 * @property {boolean} outputB         right output is enabled
*/

/**
 * A loop‑back element, connecting one grid position back to another.
 *
 * @typedef {Object} LoopBackNode
 * @property {string} id                Unique loop‑back ID, e.g. "l:0"
 * @property {"left"|"right"} direction Which side the loop‑back originates from
 * @property {PositionGrid} input   Entry point of the loop‑back
 * @property {PositionGrid} output  Exit point of the loop‑back
*/

/**
 * The full compiled layout extracted from the HTML grid.
 *
 * @typedef {Object} CompiledHtmlLayout
 * @property {number} inputs            Number of input lanes
 * @property {BalancerNode[]} balancers Array of all balancer nodes
 * @property {LoopBackNode[]} loopBacks Array of all loop‑back nodes
*/






/**
 * 
 * @param {HTMLElement} grid 
 * @param {HTMLElement[]} all_loop_back_elements_and_target 
 * @param {number} inputs 
 * @returns {CompiledHtmlLayout}
*/
function compile_html_elements(grid, all_loop_back_elements_and_target, inputs) {
	// A is left, B is right
	console.log(grid, all_loop_back_elements_and_target)
	return {
		inputs,
		balancers:Array.from(grid.children)
		.filter(el => el.classList.contains('balancer'))
		.map((el, idx)=>{
			/**@type {number[]} */
			const area = el.style.gridArea.split('/').map(s=>Number(s))
			const output_disable = el.getAttribute('data-out-disabled')
			return {
				id:'b:'+String(idx),
				row: area[0],
				inputColA: area[1],
				inputColB: area[3]-1,
				outputA: output_disable!=='left',
				outputB: output_disable!=='right',
			}
		})
		,
		loopBacks:Array.from(all_loop_back_elements_and_target)
		.map((lb, idx)=>{
			/**@type {number[]} */
			const area = lb.element.style.gridArea.split('/').map(s=>Number(s))
			const direction = lb.element.classList.contains('loop-back-right') ? 'right' : 'left'
			return {
				id:'l:'+String(idx),
				direction,
				input:{
					row: area[0],
					column: direction==='right' ? area[1] : area[3]-1 ,
				},
				output:{
					row: Number(lb.target.style.gridRowStart),
					column: direction==='left' ? area[1] : area[3]-1 ,
				}
			}
		})
	}
}
document.getElementById('compile-html-button').addEventListener('click', ()=> {
	console.log('compile HTML')
	console.log(compile_html_elements(main_grid, all_loop_back_elements_and_target, amount_of_input_lanes))
})






/**
 * Compiles CompiledHtmlLayout to a directed graph of balancers
 * @param {CompiledHtmlLayout} layout 
 * @returns 
*/
function compileCHLAsJson(layout) {

	/**
	 * @param {PositionGrid} position 
	 * @returns {LoopBackNode|BalancerNode|null}
	 */
	const checkOverlap = (position)=>{
		return layout.balancers.find(bal=>
			bal.row === position.row && (bal.inputColA === position.column || bal.inputColB === position.column)
		) ?? 
		layout.loopBacks.find(back=>
			back.input.row === position.row && back.input.column === position.column
		) ?? null
	}

	/**
	 * @param {number} column 
	 * @param {BalancerNode} balancer 
	 * @returns {"left"|"right"|null}
	 */
	const getSide = (column, balancer)=>{
		if (balancer.inputColA === column) {
			return "left"
		} else if (balancer.inputColB === column) {
			return "right"
		}
		return null
	}

	/**
	 * 
	 * @param {PositionGrid} startPosition 
	 * @param {number} maxSteps 
	 * @returns {null|{hit:BalancerNode, position:PositionGrid}}
	 */
	const traceDown = (startPosition, maxSteps)=>{
		for (let i = 0; i < maxSteps; i++) {
			/**@type {PositionGrid} */
			const stepPos = {row:startPosition.row + i, column:startPosition.column}
			const overlap = checkOverlap(stepPos)
			if (!overlap) {
				continue
			}
			if (overlap.id.startsWith('b')) {
				return {hit:overlap, position:stepPos}
			}
			if (overlap.id.startsWith('l')) {
				/**@type {LoopBackNode} */
				const lb = overlap
				return traceDown(lb.output, maxSteps)
			}
		}
		return null
	}

	const maxSteps = Math.max(...layout.balancers.map(b => b.row), ...layout.loopBacks.map(l => l.input.row)) + 5

	const resultBalancers = layout.balancers.map(balancer => {
		/**@type {PositionGrid} */
		const outAStart = { row: balancer.row + 1, column: balancer.inputColA }
		/**@type {PositionGrid} */
		const outBStart = { row: balancer.row + 1, column: balancer.inputColB }

		let traceA = null
		let traceB = null

		if (balancer.outputA){
			traceA = traceDown(outAStart, maxSteps)
		}
		if (balancer.outputB){
			traceB = traceDown(outBStart, maxSteps)
		}

		const resultBalancer = {id:balancer.id}
		if (balancer.outputA) {
			if (traceA) {
				const side = getSide(traceA.position.column, traceA.hit)
				if (side === null) throw new Error("Could not find side despite hitting the balancer");
				resultBalancer.outA = {target:traceA.hit.id, slot: side === 'left' ? 1 : 2}
			} else {
				resultBalancer.outA = {target:'output', slot: balancer.inputColA}
			}
		}
		if (balancer.outputB) {
			if (traceB) {
				const side = getSide(traceB.position.column, traceB.hit)
				if (side === null) throw new Error("Could not find side despite hitting the balancer");
				resultBalancer.outB = {target:traceB.hit.id, slot: side === 'left' ? 1 : 2}
			} else {
				resultBalancer.outB = {target:'output', slot: balancer.inputColB}
			}
		}
		return resultBalancer
	})

	const resultInputs = []
	for (let i = 0; i < layout.inputs; i++) {
		const start = {row:0, column: i+1}
		const trace = traceDown(start, maxSteps)

		if (!trace) {
			resultInputs.push({target:'output', slot: i+1})
		} else {
			resultInputs.push
			({
				target:trace.hit.id,
				slot: i+1
			})
		}
	}

	return {
		inputs:resultInputs,
		sNodes:resultBalancers
	}
}



document.getElementById('compile-json-button').addEventListener('click', () => {
	console.log('compile as json')
	console.log(
		compileCHLAsJson(compile_html_elements(main_grid, all_loop_back_elements_and_target, amount_of_input_lanes)),
		JSON.stringify(compileCHLAsJson(compile_html_elements(main_grid, all_loop_back_elements_and_target, amount_of_input_lanes)))
	)
})



/**
 * @type {CompiledHtmlLayout}
 */
const compiledHtmlLayout = {
	inputs:1,
	balancers:[{
		id:        'b:0',
		row:       3,
		inputColA: 1,
		inputColB: 2,
		outputA:   true,
		outputB:   true,
	}],
	loopBacks:[{
		id:       'l:0',
		direction:'right',
		input:    {row:4, column:2},
		output:   {row:2, column:2}
	}]
}
console.log(compileCHLAsJson(compiledHtmlLayout))
/*
expected return:
see simulation.js
{Balancer} schema for more info
*/

