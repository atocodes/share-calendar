//
const date = new Date()
const monthsArr = []
const weekDaysArr = []

// 
let selected_dates = []
let send = []
// date_and_calander DIV
const calanderDiv = document.getElementById('date_and_calander')

// JS divs
const topDiv = document.createElement('div')
topDiv.id = 'topDiv'

// date and month div
const dateAndMonth = document.createElement('div')
dateAndMonth.id = 'dateAndMonth'

const currentDate = date.getDate()
const currentMonth = new Date().toLocaleString('default',{month : 'long'})

const h1Date = document.createElement('h1')
h1Date.textContent = currentDate
const h3Month = document.createElement('h3')
h3Month.textContent = currentMonth

calanderDiv.append(topDiv)
dateAndMonth.append(h1Date,h3Month)
topDiv.append(dateAndMonth)

// Year And Month div
const yearAndMonthDiv = document.createElement('div')
yearAndMonthDiv.id = 'yearAndMonthDiv'

// current year
let currentYear = date.getFullYear()
const h3Year = document.createElement('h3')
h3Year.textContent = currentYear
yearAndMonthDiv.append(h3Year)

// let months
const monthsDiv = document.createElement('div')
monthsDiv.id = 'monthsDiv'

const [monthsRow1,monthsRow2] = [document.createElement('div'),document.createElement('div')]

for(let i = 0; i <= 11; i++){
    const month = new Date(currentYear,i).toLocaleString('default', {month : 'short'})
    const month_div = document.createElement('div')
    month_div.id = 'month_div'
    month_div.append(month)
    monthsArr.push(month)
    if(month == currentMonth.slice(0,3))month_div.className = 'selected-month'

    if(i <= 5) {
        monthsRow1.append(month_div)
        monthsRow1.id = 'mRow1'
        monthsRow1.className = 'mRow'
    }else {
        monthsRow2.append(month_div)
        monthsRow2.id = 'mRow2'
        monthsRow2.className = 'mRow'
    }
}
monthsDiv.append(monthsRow1,monthsRow2)
yearAndMonthDiv.append(monthsDiv)
topDiv.append(yearAndMonthDiv)

// setting up data grabing method
for(let month of monthsArr){
    const data = {
        month: month,
        dates: []
    }

    selected_dates.push(data)
}

// weekDays

const weekDaysDiv = document.createElement('div')
weekDaysDiv.id = 'weekdays'

for(let i = 0; i <= 6; i++){
    const weekDay = new Date(date.getFullYear(),date.getMonth(),i-3).toLocaleString('default',{weekday : 'short'})
    weekDaysArr.push(weekDay)
    const weekDayDiv = document.createElement('div')
    weekDayDiv.id = 'weekday'
    const p = document.createElement('p')
    p.textContent = weekDay
    weekDayDiv.append(p)
    weekDaysDiv.append(weekDayDiv)
}
calanderDiv.append(weekDaysDiv)

// Dates

const mainDiv = document.createElement('div')
mainDiv.id = 'datesDiv'

let pushTo
function datesDiv(selectedMonth = date.getMonth(),datesDiv = mainDiv){

    let targetMonth = monthsArr[selectedMonth]
    selected_dates.forEach(data =>{
        if(data.month == targetMonth)pushTo = data
    })

    mainDiv.innerHTML = ''
    let lastDate = new Date(date.getFullYear(),selectedMonth + 1,0).getDate()
    let firstDateDay = new Date(date.getFullYear(),selectedMonth ,1).getDay()
    
    let dateRow
    let count = 1
    let dateN = 1
    
    for(let i = 0; i <= Math.floor(lastDate/7); i++){
        dateRow = document.createElement('div')
        dateRow.id = `dateRow`
        dateRow.className = `r${i}`
    
        if(i == 0){
            for(let i = 1; i <= firstDateDay; i++){
                const dateDiv = document.createElement('div')
                dateDiv.id = 'dateDiv'
                dateRow.append(dateDiv)
            }
            count = firstDateDay + 1
        }
        do{
            // console.log(count,dateN,dateRow)
            const dateDiv = document.createElement('div')
            dateDiv.id = 'dateDiv'
    
            const p = document.createElement('p')
            p.textContent = dateN
            
            if(dateN <= lastDate){
                dateDiv.append(p)        
                dateRow.append(dateDiv)
    
                dateN++
            }
            count++
        }while(count <= Math.floor(lastDate/4))
    
        if( i == Math.floor(lastDate/7)){
    
            if(dateRow.childNodes.length != Math.floor(lastDate/4)){
                const leftDivs = Math.floor(lastDate/4) - dateRow.childNodes.length
    
                for(let i = 1; i <= leftDivs; i++){
                    const dateDiv = document.createElement('div')
                    dateDiv.id = 'dateDiv'
    
                    const p = document.createElement('p')
    
                    dateDiv.append(p)
                    dateRow.append(dateDiv)
                }
            }
        }
        count = 1
        datesDiv.append(dateRow)
    }
    
    calanderDiv.append(datesDiv)
    
    const dates = document.querySelectorAll('#dateDiv')

    if(send.length > 0){
        send.forEach(d => {
            const nowSelectedMonth = monthsArr[selectedMonth]

            if(d.month === nowSelectedMonth){
                // console.log(d.dates)

                for(let selectedDate of d.dates){
                    for(let monthDate of dates){
                        if(selectedDate == monthDate.textContent){
                            monthDate.classList.add('selected')
                        }
                    }
                }
            }
        })
    }

    for(let date of dates){
        date.onclick = ()=>{
            date.classList.toggle('selected')
            const selected = date.childNodes[0].textContent
            if(!pushTo.dates.includes(selected)){
                pushTo.dates.push(selected)
            }else{
                pushTo.dates[pushTo.dates.indexOf(selected)] = ''
                pushTo.dates = pushTo.dates.filter(e=>{
                    return e!=''
                })
            }
            // console.log(pushTo)
        }
    }
}

datesDiv()

const months = document.querySelectorAll('#month_div')
const input = document.getElementById('grab')
months.forEach(month => {
    month.onclick = () =>{
        // console.log(send)
        const description_div = document.getElementById('description') //! prototype bugs can happen in UI/UX but dont affect the app functionality
        let info_div

        months.forEach(e => {
            e.classList.remove('selected-month')
            description_div.innerHTML = ''
            
        })
        
        if(pushTo.dates.length > 0)send.push(pushTo)
        month.classList.add('selected-month')
        
        
        let ind = monthsArr.indexOf(month.textContent)
        datesDiv(ind,mainDiv)
        input.value = JSON.stringify(send)
        
        description_div.innerHTML = ''
        send.forEach(date=>{
            console.log(date)
            // console.log(send)
            // console.log(description_div)
            info_div = document.createElement('div')
            info_div.id = 'overview_div'

            const overview = document.createElement('div')
            overview.id = 'overview'
            const monthName = document.createElement('p')
            monthName.className = 'overview_monthName'
            monthName.id = date.month
            monthName.textContent = date.month.toUpperCase()

            const selected_dates_div = document.createElement('div')
            selected_dates_div.id = 'overview_selecteddays_from_the_month'
            selected_dates_div.style.gridTemplateColumns = `repeat(${date.dates.length},30px)`

            let month_date
            date.dates.forEach(date=>{
                month_date = document.createElement('div')
                month_date.id = 'month_date' 

                const date_no = document.createElement('p')
                date_no.textContent = date

                month_date.append(date_no)
                selected_dates_div.append(month_date)
            })

            overview.append(monthName,selected_dates_div)
            description_div.append(overview)
            console.log(info_div)
        })
    }
})

const button = document.getElementById('btn')
button.onclick = ()=> {
    console.log(send)
    // send.push(pushTo)
    input.value = JSON.stringify(send)
    // console.log(input.value)
}

// * to format dates selected by the user
function arrayToTextFormat (arr){
    let given = arr
    let result
    if(given.length > 1){
        const newArr = []
        given.forEach((item,index)=>{
            if(index <= given.length-2){
                newArr.push(item)
            }
        })
        result = `${newArr.toString()} and ${given[given.length-1]}` 
    }else{
        return given.toString()
    }
    return result
}



const img_div = document.getElementById('img_div')
const randomColor = `#${Math.floor(Math.random() * 1e7).toString(16)}`
img_div.style.backgroundColor = randomColor