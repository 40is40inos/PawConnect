import './displayUsers.css'

export const DisplayUsers = ({users, showType = false}) => {

    const generateSubInfo = (text , value) => { 
        return (
            <div className="subInfo"> <div className="text">{text} :</div>  <div className='value'>{value}</div></div>
        )
    }

    const gender = (g) =>{
        switch(g){
            case 'F' : return 'Female'
            case 'M' : return 'Male'
            case 'O' : return 'Other'


        }
    }
    if(!users?.length){
        return (
            <div className="displayUsers">
                <div className="noUsers">No users</div>
            </div>
        )
    }
    return (
        <div className="displayUsers">
            {users.map(user => {
                return (
                    <div className="user" key={user.userName} onClick={()=>{user.onClick && user?.onClick()}}>
                        
                        <div className="userName">{user.firstName} {user.lastName}</div>

                        <div className="categoryTitle">Information</div>
                        
                        {generateSubInfo('User name' , user.userName)}
                        {generateSubInfo('Telephone' , user.phoneNumber)}
                        {generateSubInfo('Email' , user.email)}
                        {generateSubInfo('Birth date' , user.birthdate.split('T')[0])}
                        {generateSubInfo('Sex' , gender(user.sex))}
                        

                        <div className="categoryTitle">Address</div>

                        {generateSubInfo('Address' , user.address)}
                        {generateSubInfo('City' , user.city)}
                        {generateSubInfo('Country' , user.country)}

                        {showType && <div className="categoryTitle">Type</div>}
                        {showType && generateSubInfo('Type' , user.type)}
                        
                    </div>
                )
            })}
        </div>
    )
}

// links = [{link , title , text}]
export const DisplayLinks = (links) => {

    const buildButton = (link) => {
        return (
            <button className="linkButton" onClick={() => {window.open(link.link)}}>{link.text}</button>
        )
    }

    return (
        <div className="displayUsers">
            {links.map(link => {
                return (
                    <div className="user" key={link.link}>
                        
                        <div className="userName">{link.title}</div>
                        {buildButton(link)}
                        
                    </div>
                )
            })}
        </div>
    )
}