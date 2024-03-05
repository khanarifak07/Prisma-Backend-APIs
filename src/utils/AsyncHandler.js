//higher Order Function
//A func receives another func as argument and returns a func is called higher order function
//const func = ()=>{} --normal funcion
//const func = () => {()=> {}} higher order function with curly braces
//const func = () => () => {} higher order function without curly braces

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asyncHandler };
