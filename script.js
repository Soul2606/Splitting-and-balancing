




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




class Balancer{
	constructor(input_dlvt_a, input_dlvt_b, output_dlvt_a, output_dlvt_b){
		this.input_dlvt_a = input_dlvt_a
		this.input_dlvt_b = input_dlvt_b
		this.output_dlvt_a = output_dlvt_a
		this.output_dlvt_b = output_dlvt_b
		this.oscillation = false
	}

	toggle_swap(){
		if (input_dlvt_a === undefined || input_dlvt_b === undefined || output_dlvt_a === undefined || output_dlvt_b === undefined) {
			throw new Error("undefined parameters in:", this);
		}
		let failed = false
		//Random
		if (this.oscillation) {
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_a)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_b)
		}else{
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_b)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_a)
		}
		this.oscillation = !this.oscillation
		if (failed) {
			throw new Error("failed to configure new targets:", this);
			
		}
	}

	push_to_empty_outputs(){
		//This function exists to essentially give a buffer for one dlvt, if input stops for only one cycle, then the flow will still be continuous
		if (input_dlvt_a === undefined || input_dlvt_b === undefined || output_dlvt_a === undefined || output_dlvt_b === undefined) {
			throw new Error("undefined parameters in:", this);
		}

		// If only one non empty input has only one empty output available: reconfigure targets so that a transfer is guaranteed to happen
		let failed = false
		const input_a_empty = this.input_dlvt_a === null
		const input_b_empty = this.input_dlvt_b === null
		const output_a_empty = this.output_dlvt_a === null
		const output_b_empty = this.output_dlvt_b === null

		if ((input_a_empty && !input_b_empty && output_a_empty && !output_b_empty) || 
		(!input_a_empty && input_b_empty && !output_a_empty && output_b_empty)) {
			//Cross
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_b)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_a)
			this.oscillation = true
		}else if ((input_a_empty && !input_b_empty && !output_a_empty && output_b_empty) || 
		(!input_a_empty && input_b_empty && output_a_empty && !output_b_empty)) {
			//Straight
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_a)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_b)
			this.oscillation = false
		}
		// If both these conditions fail then keep targets as is (random)
		this.input_dlvt_a.transfer()
		this.input_dlvt_b.transfer()
		if (failed) {
			throw new Error("failed to configure new targets:", this);
			
		}
	}

}




const dlvt_pointers = new Set()




class Doubly_linked_variable_transporter{
	constructor(value){
		this.value = value? value: null
		this.transfer_target = null
		this.targeted_by = null
		this.pending_item_to_send = null
		this.pending_send_to = null
		this.pending_receive_from = null
	}

	set_target(new_transfer_target){
		if (this.transfer_target === new_transfer_target){
			this.targeted_by = this
			return true
		}
		if (dlvt_pointers.has(new_transfer_target)) {
			console.warn('target already exists in dlvt_pointers')
			return false
		}
		if (this.transfer_target !== null) {
			this.transfer_target.targeted_by = null
			console.log('removing from dlvt_pointers:', this.transfer_target)
			dlvt_pointers.delete(this.transfer_target)
		}
		if (new_transfer_target.targeted_by !== null) {
			throw new Error("This DLVT is already targeted by another DLVT");
		}
		new_transfer_target.targeted_by = this
		this.transfer_target = new_transfer_target
		dlvt_pointers.add(new_transfer_target)
		return true
	}

	transfer(){
		if (this.transfer_target === null) {
			return false
		}
		if (this.transfer_target.value !== null) {
			return false
		}
		if (this.transfer_target === this) {
			return true
		}
		this.transfer_target.value = this.value
		this.value = null
		return true
	}

	transfer_recursively(){

		if (this.transfer_target === undefined) {
			console.warn(this.transfer_target, ', is undefined instead of null')
		}

		if (this.transfer_target === null || this.transfer_target === undefined) {
			// Transfer can only proceed if the final DLVT is empty
			if (this.value === null) {
				return {success:true, info:{termination:'hit end', chain:[{reference:this, success:true}]}}
			}else{
				return {success:false, info:{termination:'hit end', chain:[{reference:this, success:false}]}}
			}
		}

		if(this.transfer_target.pending_receive_from !== null){
			// when a loop is detected the chain must start empty
			return {success:true, info:{termination:'loop', chain:[]}}
		}

		this.pending_item_to_send = this.value
		this.pending_send_to = this.transfer_target
		this.transfer_target.pending_receive_from = this
		const results = this.transfer_target.transfer_recursively()
		const can_transfer = results.success || this.transfer_target.value === null
		if (can_transfer) {
			// This must happen first
			if (this.pending_receive_from === null) {
				this.value = null
			}
			this.transfer_target.value = this.pending_item_to_send
		}
		this.pending_item_to_send = null
		this.pending_send_to = null
		this.pending_receive_from = null
		results.info.chain.unshift({reference:this, success:can_transfer})
		results.success = can_transfer
		return results
	}

	search_backwards(origin){
		const results_set = new Set()
		if (origin === undefined) {
			return results_set
		}
		if (this.targeted_by === origin) {
			results_set.add(this)
			return results_set
		}
		if (this.targeted_by === null) {
			results_set.add(this)
			return results_set
		}
		this.targeted_by.search_backwards(origin).forEach(item => {
			results_set.add(item)	
		})
		results_set.add(this)
		return results_set 
	}

	search(origin){
		const results_set_if_loop = new Set()
		if (origin === undefined) {
			throw new Error("search called without origin defined");
		}
		if (this.transfer_target === origin) {
			results_set_if_loop.add(this)
			return {termination:'loop', set:results_set_if_loop}
		}
		if (this.transfer_target === null) {
			//If this dlvt does not have a transfer target that means that this chain is not a loop, so we discard everything and search backwards
			return {termination:'linear', set:this.search_backwards(this)}
		}

		const results = this.transfer_target.search(origin)
		if (results.termination === 'linear') {
			// If the chain is linear, pass the results without modifying anything
			return results
		}
		results.set.add(this)
		return results
	}
}




function create_balancer() {
	const input_dlvt_a = new Doubly_linked_variable_transporter()
	const input_dlvt_b = new Doubly_linked_variable_transporter()
	const output_dlvt_a = new Doubly_linked_variable_transporter()
	const output_dlvt_b = new Doubly_linked_variable_transporter()
	input_dlvt_a.set_target(output_dlvt_a)
	input_dlvt_b.set_target(output_dlvt_b)
	const balancer = new Balancer(input_dlvt_a, input_dlvt_b, output_dlvt_a, output_dlvt_b)
	all_dlvts.push(input_dlvt_a)
	all_dlvts.push(input_dlvt_b)
	all_dlvts.push(output_dlvt_a)
	all_dlvts.push(output_dlvt_b)
	return {input_dlvt_a:input_dlvt_a, input_dlvt_b:input_dlvt_b, output_dlvt_a:output_dlvt_a, output_dlvt_b:output_dlvt_b, balancer:balancer}
}




function execute_transfer_on_all_dlvt_chains(all_dlvts){
	const all_transfers_info = []
	const unexecuted_dlvts = Array.from(all_dlvts)
	let failsafe = 1000

	while (unexecuted_dlvts.length > 0 && failsafe > 0) {
		const transfer_info = unexecuted_dlvts[0].transfer_recursively()
		all_transfers_info.push(transfer_info)
		const dlvt_chain_array = transfer_info.info.chain
		for (let i = 0; i < dlvt_chain_array.length; i++) {
			const dlvt_in_chain = dlvt_chain_array[i].reference;
			const index_to_remove = unexecuted_dlvts.indexOf(dlvt_in_chain)
			if (index_to_remove !== -1) {
				unexecuted_dlvts.splice(index_to_remove, 1)
			}
			if (all_dlvts.indexOf(dlvt_in_chain) === -1) {
				console.warn('found a dlvt in transfer chain that is not in all_dlvts:', dlvt_in_chain)
			}
		}
		failsafe -= 1
	}
	if (failsafe <= 0) {
		console.warn('failsafe triggered')
	}
	return all_transfers_info
}






const start_a = new Doubly_linked_variable_transporter('A')
const start_b = new Doubly_linked_variable_transporter('B')
const end_a = new Doubly_linked_variable_transporter('')
const end_b = new Doubly_linked_variable_transporter('')
const end_c = new Doubly_linked_variable_transporter('')

const start_dlvts = [start_a, start_b]

const all_dlvts = [start_a, start_b, end_a, end_b, end_c]

const balancer_1a = create_balancer()

const balancer_2a = create_balancer()

const all_balancers = [balancer_1a, balancer_2a]

start_a.set_target(balancer_1a.input_dlvt_a)
start_b.set_target(balancer_1a.input_dlvt_b)
balancer_1a.output_dlvt_a.set_target(end_a)
balancer_1a.output_dlvt_b.set_target(balancer_2a.input_dlvt_a)
balancer_2a.output_dlvt_a.set_target(end_b)
balancer_2a.output_dlvt_b.set_target(end_c)












const main_grid = document.getElementById('main-grid')

const add_input_lane_button = document.getElementById('add-input-lane-button')

const add_row_button = document.getElementById('add-row-button')
const add_loop_back_button = document.getElementById('add-loop-back-button')

let can_drag = true





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


	root.appendChild(drag_button_left)
	root.appendChild(drag_button_center)
	root.appendChild(drag_button_right)

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
	main_grid.appendChild(new_input_lane)
})




add_row_button.addEventListener('click', ()=>{
	const balancer_element = create_adjustable_grid_spanner(2, 'balancer')
	main_grid.appendChild(balancer_element)
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
	insert_child_at_index(loop_back, flip_button, 2)


	main_grid.appendChild(loop_back)
	main_grid.appendChild(loop_back_target)

	set_loop_back_target_position()

})



