const validateConfirmPassword = (passkey,passkey_re)=> passkey === passkey_re

exports.matchPassword = validateConfirmPassword

// const given = [
//     {
//       userid: '63334abef4e42ec90e976384',
//       days: [
//         { month: 'Sep', dates: [ '1', '9', '16', '30', '14', '5' ] },
//         {
//           month: 'Jul',
//           dates: [
//             '5',  '13', '19',
//             '25', '8',  '15',
//             '22'
//           ]
//         },
//         { month: 'Nov', dates: [ '4', '11', '18', '24', '8' ] 
// },
//         {
//           month: 'Jun',
//           dates: [
//             '3',  '11', '17',
//             '23', '29', '21',
//             '13', '5',  '1'
//           ]
//         },
//         { month: 'Mar', dates: [ '2', '9', '16' ] }
//       ]
//     },
//     {
//       userid: '63340e4ff4e42ec90e97639b',
//       days: [
//         {
//           month: 'Sep',
//           dates: [
//             '4',  '12', '13',
//             '14', '22', '30',
//             '1'
//           ]
//         },
//         { month: 'Feb', dates: [ '2', '9', '17', '18', '26' ] 
// },
//         { month: 'May', dates: [ '6', '13', '12', '19', '25' ] },
//         { month: 'Aug', dates: [ '3', '10', '17', '24', '25' ] },
//         { month: 'Apr', dates: [ '6', '14', '22', '29' ] }    
//       ]
//     }
// ]

class Result {

    allMonthData(given){
    
        let days = []
        
        for(let i of given){
            const givenDays = i.days
            days.push(...givenDays)
        }
        // console.log(days)
        const mergedMonths = []
        days.sort((a,b)=>{
            let ma = a.month.toLowerCase()
            let mb = b.month.toLowerCase()
        
            if(ma === mb){
                const monthA = a.dates
                const monthB = b.dates
                const merge = new Set([...monthA,...monthB])
                const result = {month : a.month, dates:[...merge]}
                mergedMonths.push(result)
            }
        
            if(ma < mb){
                return -1
            }
        
            if(ma > mb){
                return 1
            }
        
            return 0
        })
        // console.log(mergedMonths)
        const final = []
        
        days.forEach(date=>{
            mergedMonths.forEach(month =>{
                if(month.month === date.month){
                    final.push(month)
                }else{
                    final.push(date)
                }
            })
        })
        // console.log(final)
        const set = new Set(final)
        const forAlgorythm = [...set]

        const monthNames = []
        const year = new Date().getFullYear()
        for(let i = 0; i<= 11; i++){
            const monthName = new Date(year,i).toLocaleString('en-us',{month:'short'})
            monthNames.push(monthName)
        }
        
        
        const settedMonthsName = []
        for(let i of forAlgorythm){
            settedMonthsName.push(Object.values(i)[0])
        }
        const result = []
        
        for(let i of monthNames){
            if(!settedMonthsName.includes(i)){
                const format = {
                    month : i,
                    dates: []
                }
                forAlgorythm.push(format)
                // console.log(true)
            }
            
            let multiSettings = []
            
            for(let z of forAlgorythm){
                if(z.month === i){
                    multiSettings.push(z)
                }
            }

            multiSettings.sort((a,b)=>{
                if(a.dates.length > b.dates.length) return -1
                if(a.dates.length < b.dates.length) return 1
                return 0
            })

            result.push(multiSettings[0])
        }
        
        return {
            forAlgorythm:result,
            months:monthNames
        }
    }
    
    freeDays (dates){
        const year = new Date().getFullYear()
        let data = this.allMonthData(dates).forAlgorythm
        
        data = data.map(d=>{
            const newData = {
                month : d.month,
                dates: d.dates.map(e=> parseInt(e))
            }
            return newData
        })
    
        const monthData = {}
    
        for(let i  = 0; i<= 11; i++){
            const month = new Date(year,i).toLocaleString('en-us',{month:'short'})
            const dateLength = new Date(year,i,0).getDate()
            monthData[`${month}`] = dateLength
        }
    
        const finalResult = []
        for(let i of data){
            const dateLength = monthData[`${i.month}`]
            const busyDays = i.dates
            
            const freeDays = {}
            
            const monthName = i.month
            const freeDates = []
            
            
            for(let i = 1; i<= dateLength; i++){
                if(busyDays.length === 0){
                    freeDates.push('Free Month')
                    break
                }else if(!busyDays.includes(i)){
                    freeDates.push(i)
                }
            }
            freeDays.month = monthName
            freeDays.dates = freeDates
    
            // console.log(i,dateLength)
            finalResult.push(freeDays)
        }
    
        const arrangedMonths = this.allMonthData(dates).months
        const result = []
    
        arrangedMonths.forEach(month =>{
            finalResult.forEach(res=>{
                if(res.month === month){
                    result.push(res)
                }
            })
        })
    
        return result
    }
}

const result = new Result()

exports.result = result

const data =  [
    {
      userid: '63334abef4e42ec90e976384',
      days: [
        {
          month: 'Sep',
          dates: [
            '4',  '12', '15',
            '21', '27', '10',
            '24', '30', '1'
          ]
        },
        {
          month: 'Mar',
          dates: [
            '2',  '10', '23',
            '22', '14', '6',
            '8',  '25', '5',
            '26'
          ]
        },
        {
          month: 'Dec',
          dates: [
            '2',  '8',  '14',
            '20', '12', '4',
            '25', '30', '17',
            '16'
          ]
        },
        {
          month: 'Jan',
          dates: [
            '4',  '12', '20', '26',
            '25', '17', '9',  '3',
            '14', '8',  '22', '28',
            '23'
          ]
        },
        {
          month: 'Mar',
          dates: [
            '2',  '10', '23',
            '22', '14', '6',
            '8',  '25', '5',
            '26'
          ]
        },
        {
          month: 'Apr',
          dates: [
            '3',  '11', '19',
            '20', '28', '22',
            '16', '8',  '7'
          ]
        }
      ]
    },
    {
      userid: '6335127cfd8608a3c6460b52',
      days: [
        { month: 'Sep', dates: [ '5', '13', '8', '16', '3' ] },
        {
          month: 'Jan',
          dates: [
            '4',  '11', '18',
            '25', '29', '6',
            '13'
          ]
        },
        {
          month: 'Jun',
          dates: [
            '3',  '10', '17',
            '15', '14', '20',
            '12', '30', '11',
            '25', '1'
          ]
        },
        {
          month: 'Jan',
          dates: [
            '4',  '11', '18',
            '25', '29', '6',
            '13'
          ]
        },
        {
          month: 'Aug',
          dates: [
            '2',  '9', '17', '24',
            '19', '6', '4',  '22',
            '14', '8', '30', '28'
          ]
        },
        {
          month: 'May',
          dates: [
            '12', '20', '26',
            '18', '10', '2',
            '16', '24', '30',
            '22', '7'
          ]
        }
      ]
    },
    {
      userid: '63340e4ff4e42ec90e97639b',
      days: [
        {
          month: 'Sep',
          dates: [
            '4',  '12', '20', '14',
            '9',  '17', '24', '23',
            '29', '1',  '28', '26',
            '18'
          ]
        },
        {
          month: 'Jul',
          dates: [
            '11', '19', '27',
            '25', '17', '14',
            '22', '30', '2'
          ]
        }
      ]
    }
]
