import { useEffect } from "react"
import { tryMainPage , updateUser } from "../../api/login"
import { useNavigate  } from "react-router-dom";
import { useState } from "react";
import { getPetOwner , getPetKeeper } from "../../api/getThings";
import './mainPage.css'
import { DisplayUsers } from "../../components/displayUsers/displayUsers";
export const MainPage = () => {

    const navigate = useNavigate();
    const [user, setUser] = useState(null)
    const [showUpdate , setShowUpdate] = useState(false)
    const [content , setContent] = useState(null)


    const _logout = (e) => {
        document.cookie = 'user'+'=; Max-Age=-99999999;';
        navigate('/login')
    }
    const logoutButton = <button onClick={_logout}>logout</button>

    const updateButton = <button onClick={()=>{setShowUpdate(old=>!old);setContent()}}>Update user</button>

    const _onSubmit = (e) => {
        e.preventDefault();
        console.log(e);
        const {   firstName, lastName, sex, 
                country, city, address, phoneNumber, password} = e.target;


        updateUser(
            user.userName,
            {    
                firstName: firstName.value,
                lastName: lastName.value,
                sex: sex.value,
                password: password.value,
                country: country.value,
                city: city.value,
                address: address.value,
                phoneNumber: phoneNumber.value
            }
        ).then( res =>{setShowUpdate(false) ; setUser(res); console.log(res)} ).catch(err =>{ console.log(err); })


    }

    const getValueOfSex = ({sex})=>{
        switch (sex) {
            case 'Female': return 'F'
            case 'Male' : return 'M'
            case 'Other' : return 'O'
            default: return 'F'
        }
        
    }

    const _form = ()  => (
        <form onSubmit={_onSubmit} className="mainPageForm">
            Update your information details:
            <label>First name:
                <input name="firstName"  type="text" defaultValue={user.firstName}  />
            </label>
            <label>Last name:
                <input name="lastName"  type="text" defaultValue={user.lastName}  />
            </label>
            <label>Password:
                <input name="password"  type="password" defaultValue={user.password} />
            </label>
            <label>Birthdate:
                <input name="birthdate"  type="date"  defaultValue={new Date(user.birthdate.split('T')[0])}  />
            </label>
            
            <label>Sex:
                <select id='sex' name='sex' size={1} defaultValue={getValueOfSex(user)}  >
                    <option value='F'>Female</option>
                    <option value='M'>Male</option>
                    <option value='O'>Other</option>
                </select>
            </label>
            <label>Country:
                <input name="country"  type="text" defaultValue={user.country} />
            </label>
            <label>City:
                <input name="city"  type="text"  defaultValue={user.city} />
            </label>
            <label>Address:
                <input name="address"  type="text" defaultValue={user.address}  />
            </label>
            <label>Phone number:
                <input name="phoneNumber"  type="number"  defaultValue={user.phoneNumber} />
            </label>
            
            <div className='buttons'>
                <button className='submitButton' type="submit">Update Details</button>
                <button className='submitButton' type="button" onClick={()=>setShowUpdate(false)}>Cancel</button>
            </div>
        </form>
    )

    const getType = (type) => {
        switch (type) {
            case 'PETKEEPER':
                return 'pet keeper'
            case 'PETOWNER':
                return 'pet owner'
            default:
                return ''
        }
    }

    useEffect(() => {
        tryMainPage().then(res => {
            if(res.redirect){
                navigate(res.redirect)
            }else{
                setUser(res)
            }
        }).catch(err => {
            console.log(err)
        })  
    }, [])

    useEffect(() => {
        console.log(user)
    }, [user])




    const getButton = (type) => {
        switch (type) {
            case 'PETKEEPER':
                return <button onClick={() => {
                    setShowUpdate(false) // close update form
                    
                    getPetOwner().then(res => { // else fetch and show content
                        setContent(<div style={{display:"flex", flexDirection:"column",justifyContent:"center" , width:"100%", alignContent:"center", alignItems:"center"}}>Showing Pet Owners<DisplayUsers users={res}/></div>)
                    }).catch(err => {
                        console.log(err)
                    })
                
                }}>pet owners</button>
            case 'PETOWNER':
                return <button onClick={() => {
                    setShowUpdate(false)
                    getPetKeeper().then(res => {
                        setContent(<div style={{display:"flex", flexDirection:"column",justifyContent:"center" , width:"100%", alignContent:"center", alignItems:"center"}}>Showing Pet keepers<DisplayUsers users={res}/></div>)
                    }).catch(err => {
                        console.log(err)
                    })
                
                
                }}>pet keepers</button>
            default:
                return ''
        }
    }


    return <div className="mainPage"> 
        <div className="mainPageTitle">Welcome {getType(user?.type)} {`${user?.firstName} ${user?.lastName}`}</div>
        <div className="mainPageBody">
            {showUpdate ? _form() : ''}
            {content}
        </div>
        <div className='footer'>{logoutButton} {getButton(user?.type)} {updateButton}</div>
    </div>

}