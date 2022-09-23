// create and join group

const join_btn = document.getElementsByClassName('join_btn')[0]
const create_btn = document.getElementsByClassName('create_btn')[0]

const create_group_form = document.getElementsByClassName('create')[0]
const join_group_form = document.getElementsByClassName('join')[0]

join_btn.onmouseover= () =>{
    join_group_form.style.display = 'flex'
    create_group_form.style.display = 'none'
    // join_btn.classList.add('active_btn')
}

join_group_form.onmouseleave= ()=>{

    setTimeout(()=>{
        
        join_group_form.style.display = 'none'
        join_btn.classList.remove('active_btn')
    },1500)
}


create_btn.onmouseover = () =>{
    create_group_form.style.display = 'flex'
    join_group_form.style.display = 'none'
    // create_btn.classList.add('active_btn')
}

create_group_form.onmouseleave = () =>{

    setTimeout(()=>{

        create_group_form.style.display = 'none'
        create_btn.classList.remove('active_btn')
    },1500)
}

// value regenerator
const groupIdInput = document.getElementById('groupId')
groupIdInput.onfocus = e =>{
    if(groupIdInput.value == ''){
        groupIdInput.value = '@'
    }
}
