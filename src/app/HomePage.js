import React from 'react'

export default class HomePage extends React.Component{
    render() {
        return (
            <div id="content">
                {/* row */}
                <div className="row">
                    <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="text-center error-box">
                                    <h1 className="error-text tada animated"><i/>API OneLink</h1>
                                    <p className="lead semi-bold">
                                        <strong>BackEnd OneLink</strong><br/>                                    
                                    </p>       
                                    <h2 className="font-xl"><strong>We can find the api you're looking for.</strong></h2>                       
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* end row */}
            </div>
        )
    }
}